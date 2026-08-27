import { auth } from "@/auth";
import { gameHasNotStartedSql } from "@/lib/game-start-time";
import { getPool } from "@/lib/db";
import { resolvePlayerPicksWeek } from "@/lib/player-picks-week";
import { isPickWindowOpen } from "@/lib/pool-week";
import type { EventRow } from "@/types/picks";
import { NextResponse } from "next/server";

export type { EventRow } from "@/types/picks";

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
    const { rows } = await pool.query<EventRow>(
      `SELECT "Game_ID", "FK_Week", "Home_Team_Name", "Away_Team_Name",
              "Home_Team_ATS"::text, "Away_Team_ATS"::text, "Game_Start_Time"::text
       FROM public."Events"
       WHERE "FK_Week" = $1 AND ${gameHasNotStartedSql}
       ORDER BY "Game_Start_Time" ASC, "Home_Team_Name" ASC`,
      [week],
    );
    return NextResponse.json({ week, events: rows });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
