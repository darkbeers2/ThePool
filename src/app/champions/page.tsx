import { AppShell } from "@/components/AppShell";
import { auth } from "@/auth";
import {
  getChampionsByPlayer,
  getChampionsByYear,
  type ChampionByPlayerRow,
  type ChampionByYearRow,
} from "@/lib/champions";
import { ChampionsClient } from "./ChampionsClient";

export default async function ChampionsPage() {
  const session = await auth();
  let byYear: ChampionByYearRow[] = [];
  let byPlayer: ChampionByPlayerRow[] = [];
  let error: string | null = null;

  if (!session?.user?.playerId) {
    error = "Unauthorized";
  } else {
    try {
      [byYear, byPlayer] = await Promise.all([
        getChampionsByYear(),
        getChampionsByPlayer(),
      ]);
    } catch (e) {
      console.error(e);
      error = "Database error";
    }
  }

  return (
    <AppShell playerName={session?.user?.playerName}>
      <ChampionsClient byYear={byYear} byPlayer={byPlayer} error={error} />
    </AppShell>
  );
}
