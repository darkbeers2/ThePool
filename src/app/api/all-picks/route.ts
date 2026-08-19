import { auth } from "@/auth";
import { getPool } from "@/lib/db";
import { isRevealWindowOpen } from "@/lib/pool-week";
import { resolveRevealWeek } from "@/lib/week-service";
import { NextResponse } from "next/server";

export type PlayerPickRow = {
  FK_Player_ID: number;
  FK_Game_ID: string;
  Home_Team_ATS: string | null;
  Away_Team_ATS: string | null;
  Final_Home_Team_Score: number | null;
  Final_Away_Team_Score: number | null;
  Home_Team_Name: string | null;
  Away_Team_Name: string | null;
  FK_Week: number;
  Is_Lock: boolean | null;
  Result: number | null;
  Is_Push: boolean | null;
  Is_Game_Over: boolean | null;
  Player_Name: string;
};

export async function GET() {
  const session = await auth();
  if (!session?.user?.playerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isRevealWindowOpen()) {
    return NextResponse.json(
      {
        error:
          "All Picks are only visible Saturday 12:00 PM ET – Tuesday 6:00 AM ET the following week.",
      },
      { status: 403 },
    );
  }

  try {
    const pool = getPool();
    const week = await resolveRevealWeek(pool);
    const { rows } = await pool.query<PlayerPickRow>(
      `SELECT pp."FK_Player_ID", pp."FK_Game_ID",
              pp."Home_Team_ATS"::text, pp."Away_Team_ATS"::text,
              pp."Final_Home_Team_Score", pp."Final_Away_Team_Score",
              pp."Home_Team_Name", pp."Away_Team_Name", pp."FK_Week",
              pp."Is_Lock", pp."Result", pp."Is_Push", pp."Is_Game_Over",
              pl."Player_Name"
       FROM public."PlayerPick" pp
       INNER JOIN public."Players" pl ON pl."Player_ID" = pp."FK_Player_ID"
       WHERE pp."FK_Week" = $1
       ORDER BY pl."Player_Name" ASC, pp."FK_Game_ID" ASC`,
      [week],
    );
    return NextResponse.json({ week, picks: rows });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
