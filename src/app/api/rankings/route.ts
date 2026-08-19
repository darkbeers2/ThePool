import { auth } from "@/auth";
import { getPool } from "@/lib/db";
import { NextResponse } from "next/server";

export type SummaryRow = {
  FK_Player_ID: number;
  Rank: number | null;
  Week1: number | null;
  Week2: number | null;
  Week3: number | null;
  Week4: number | null;
  Week5: number | null;
  Week6: number | null;
  Week7: number | null;
  Week8: number | null;
  Week9: number | null;
  Week10: number | null;
  Week11: number | null;
  Week12: number | null;
  Week13: number | null;
  Week14: number | null;
  BowlWeek: number | null;
  NC: number | null;
  Total: number | null;
  SecondHalf: number | null;
  SecondHalfRank: number | null;
  Week15: number | null;
  Player_Name: string;
};

export async function GET() {
  const session = await auth();
  if (!session?.user?.playerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const pool = getPool();
    const { rows } = await pool.query<SummaryRow>(
      `SELECT s."FK_Player_ID", s."Rank", s."Week1", s."Week2", s."Week3", s."Week4",
              s."Week5", s."Week6", s."Week7", s."Week8", s."Week9", s."Week10",
              s."Week11", s."Week12", s."Week13", s."Week14", s."BowlWeek", s."NC",
              s."Total", s."SecondHalf", s."SecondHalfRank", s."Week15",
              p."Player_Name"
       FROM public."Summary" s
       INNER JOIN public."Players" p ON p."Player_ID" = s."FK_Player_ID"
       ORDER BY s."Rank" NULLS LAST, p."Player_Name" ASC`,
    );
    return NextResponse.json({ rows });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
