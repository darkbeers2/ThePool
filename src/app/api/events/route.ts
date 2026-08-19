import { auth } from "@/auth";
import { getPool } from "@/lib/db";
import { resolvePlayerPicksWeek } from "@/lib/player-picks-week";
import { isPickWindowOpen } from "@/lib/pool-week";
import { NextResponse } from "next/server";

export type EventRow = {
  Game_ID: string;
  FK_Week: number;
  Home_Team_Name: string;
  Away_Team_Name: string;
  Home_Team_ATS: string | null;
  Away_Team_ATS: string | null;
  Game_Start_Time: string;
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
    const { rows } = await pool.query<EventRow>(
      `SELECT "Game_ID", "FK_Week", "Home_Team_Name", "Away_Team_Name",
              "Home_Team_ATS"::text, "Away_Team_ATS"::text, "Game_Start_Time"::text
       FROM public."Events"
       WHERE "FK_Week" = $1 AND "Game_Start_Time" > NOW()
       ORDER BY "Game_Start_Time" ASC, "Home_Team_Name" ASC`,
      [week],
    );
    return NextResponse.json({ week, events: rows });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
