import { auth } from "@/auth";
import {
  getChampionsByPlayer,
  getChampionsByYear,
} from "@/lib/champions";
import { NextResponse } from "next/server";

export type {
  ChampionByPlayerRow,
  ChampionByYearRow,
} from "@/lib/champions";

export async function GET() {
  const session = await auth();
  if (!session?.user?.playerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [byYear, byPlayer] = await Promise.all([
      getChampionsByYear(),
      getChampionsByPlayer(),
    ]);
    return NextResponse.json({ byYear, byPlayer });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
