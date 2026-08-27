import { auth } from "@/auth";
import { gameHasStartedSql } from "@/lib/game-start-time";
import { getPool } from "@/lib/db";
import {
  pickSideFromRow,
  resolvePlayerPicksWeek,
} from "@/lib/player-picks-week";
import { isPickWindowOpen } from "@/lib/pool-week";
import type { MyPickRow } from "@/types/picks";
import { NextResponse } from "next/server";
import { z } from "zod";

export type { MyPickRow } from "@/types/picks";

const pickSchema = z.object({
  gameId: z.string().min(1),
  side: z.enum(["home", "away"]),
  isLock: z.boolean(),
});

const bodySchema = z.object({
  picks: z.array(pickSchema).length(5),
});

type ExistingPickRow = {
  FK_Game_ID: string;
  Home_Team_Name: string | null;
  Away_Team_Name: string | null;
  Home_Team_ATS: string | null;
  Away_Team_ATS: string | null;
  FK_Week: number;
  Is_Lock: boolean | null;
  Result: number | null;
  Is_Push: boolean | null;
  Is_Game_Over: boolean | null;
  Final_Home_Team_Score: number | null;
  Final_Away_Team_Score: number | null;
  Game_Start_Time: Date;
  is_started: boolean;
};

export async function GET() {
  const session = await auth();
  if (!session?.user?.playerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isPickWindowOpen()) {
    return NextResponse.json(
      { error: "Player Picks are only open Wednesday 12:00 PM – Saturday 12:00 PM ET." },
      { status: 403 },
    );
  }

  try {
    const pool = getPool();
    const week = await resolvePlayerPicksWeek(pool);
    const { rows } = await pool.query<ExistingPickRow>(
      `SELECT pp."FK_Game_ID", pp."Home_Team_Name", pp."Away_Team_Name",
              pp."Home_Team_ATS"::text, pp."Away_Team_ATS"::text,
              pp."FK_Week", pp."Is_Lock",
              pp."Result", pp."Is_Push", pp."Is_Game_Over",
              pp."Final_Home_Team_Score", pp."Final_Away_Team_Score",
              e."Game_Start_Time",
              (${gameHasStartedSql}) AS is_started
       FROM public."PlayerPick" pp
       INNER JOIN public."Events" e ON e."Game_ID" = pp."FK_Game_ID"
       WHERE pp."FK_Player_ID" = $1 AND pp."FK_Week" = $2
       ORDER BY e."Game_Start_Time" ASC, pp."Home_Team_Name" ASC`,
      [session.user.playerId, week],
    );

    const picks: MyPickRow[] = rows.map((row) => ({
      FK_Game_ID: row.FK_Game_ID,
      Home_Team_Name: row.Home_Team_Name,
      Away_Team_Name: row.Away_Team_Name,
      Home_Team_ATS: row.Home_Team_ATS,
      Away_Team_ATS: row.Away_Team_ATS,
      FK_Week: row.FK_Week,
      Is_Lock: row.Is_Lock,
      Game_Start_Time: row.Game_Start_Time.toISOString(),
      isStarted: row.is_started,
      side: pickSideFromRow(row),
    }));

    return NextResponse.json({ week, picks });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.playerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isPickWindowOpen()) {
    return NextResponse.json(
      { error: "Player Picks are only open Wednesday 12:00 PM – Saturday 12:00 PM ET." },
      { status: 403 },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "You must submit exactly 5 picks with a home or away team for each." },
      { status: 400 },
    );
  }

  const incoming = parsed.data.picks;
  const gameIds = incoming.map((p) => p.gameId);
  if (new Set(gameIds).size !== 5) {
    return NextResponse.json(
      { error: "Duplicate games are not allowed." },
      { status: 400 },
    );
  }

  if (incoming.filter((p) => p.isLock).length > 1) {
    return NextResponse.json(
      { error: "You may designate at most one pick as a lock." },
      { status: 400 },
    );
  }

  const pool = getPool();
  const client = await pool.connect();
  let begun = false;
  try {
    await client.query("BEGIN");
    begun = true;

    const week = await resolvePlayerPicksWeek(pool);
    const { rows: existing } = await client.query<ExistingPickRow>(
      `SELECT pp."FK_Game_ID", pp."Home_Team_Name", pp."Away_Team_Name",
              pp."Home_Team_ATS"::text, pp."Away_Team_ATS"::text,
              pp."FK_Week", pp."Is_Lock",
              pp."Result", pp."Is_Push", pp."Is_Game_Over",
              pp."Final_Home_Team_Score", pp."Final_Away_Team_Score",
              e."Game_Start_Time",
              (${gameHasStartedSql}) AS is_started
       FROM public."PlayerPick" pp
       INNER JOIN public."Events" e ON e."Game_ID" = pp."FK_Game_ID"
       WHERE pp."FK_Player_ID" = $1 AND pp."FK_Week" = $2`,
      [session.user.playerId, week],
    );
    const existingByGame = new Map(existing.map((row) => [row.FK_Game_ID, row]));

    const { rows: events } = await client.query<{
      Game_ID: string;
      FK_Week: number;
      Home_Team_Name: string;
      Away_Team_Name: string;
      Home_Team_ATS: string | null;
      Away_Team_ATS: string | null;
      Game_Start_Time: Date;
      is_started: boolean;
    }>(
      `SELECT "Game_ID", "FK_Week", "Home_Team_Name", "Away_Team_Name",
              "Home_Team_ATS", "Away_Team_ATS", "Game_Start_Time",
              (${gameHasStartedSql}) AS is_started
       FROM public."Events"
       WHERE "Game_ID" = ANY($1::varchar[])`,
      [gameIds],
    );
    const eventById = new Map(events.map((ev) => [ev.Game_ID, ev]));

    if (events.length !== 5) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "Each pick must reference a valid game in the active week." },
        { status: 400 },
      );
    }

    for (const ev of events) {
      if (ev.FK_Week !== week) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { error: "All picks must belong to the active week." },
          { status: 400 },
        );
      }
    }

    for (const pick of incoming) {
      const ev = eventById.get(pick.gameId);
      if (!ev) continue;
      const prev = existingByGame.get(pick.gameId);
      const started = ev.is_started;

      if (started) {
        if (!prev) {
          await client.query("ROLLBACK");
          return NextResponse.json(
            { error: "You cannot add picks for games that have already started." },
            { status: 400 },
          );
        }
        if (
          pickSideFromRow(prev) !== pick.side ||
          Boolean(prev.Is_Lock) !== pick.isLock
        ) {
          await client.query("ROLLBACK");
          return NextResponse.json(
            {
              error:
                "Picks for games that have already started cannot be changed.",
            },
            { status: 400 },
          );
        }
      }
    }

    await client.query(
      `DELETE FROM public."PlayerPick"
       WHERE "FK_Player_ID" = $1 AND "FK_Week" = $2`,
      [session.user.playerId, week],
    );

    for (const pick of incoming) {
      const ev = eventById.get(pick.gameId)!;
      const prev = existingByGame.get(pick.gameId);
      const started = ev.is_started;
      const homeAts = pick.side === "home" ? ev.Home_Team_ATS : null;
      const awayAts = pick.side === "away" ? ev.Away_Team_ATS : null;

      await client.query(
        `INSERT INTO public."PlayerPick" (
          "FK_Player_ID", "FK_Game_ID", "Home_Team_ATS", "Away_Team_ATS",
          "Final_Home_Team_Score", "Final_Away_Team_Score",
          "Home_Team_Name", "Away_Team_Name", "FK_Week",
          "Is_Lock", "Result", "Is_Push", "Is_Game_Over"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
        )`,
        [
          session.user.playerId,
          ev.Game_ID,
          homeAts,
          awayAts,
          started && prev ? prev.Final_Home_Team_Score : null,
          started && prev ? prev.Final_Away_Team_Score : null,
          ev.Home_Team_Name,
          ev.Away_Team_Name,
          week,
          pick.isLock,
          started && prev ? prev.Result : null,
          started && prev ? prev.Is_Push : null,
          started && prev ? prev.Is_Game_Over : null,
        ],
      );
    }

    await client.query("COMMIT");
    return NextResponse.json({ ok: true, week });
  } catch (e) {
    if (begun) {
      try {
        await client.query("ROLLBACK");
      } catch {
        /* ignore */
      }
    }
    console.error(e);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  } finally {
    client.release();
  }
}
