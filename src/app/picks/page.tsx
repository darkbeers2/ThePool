import { AppShell } from "@/components/AppShell";
import { getPoolWindow, isPickWindowOpen } from "@/lib/pool-week";
import { auth } from "@/auth";
import { PicksClient } from "./PicksClient";

export default async function PicksPage() {
  const session = await auth();
  const initialWindow = { ...getPoolWindow(), pickOpen: isPickWindowOpen() };

  return (
    <AppShell playerName={session?.user?.playerName}>
      <PicksClient initialWindow={initialWindow} />
    </AppShell>
  );
}
