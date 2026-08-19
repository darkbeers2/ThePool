import { AppShell } from "@/components/AppShell";
import { auth } from "@/auth";
import { getPoolWindow } from "@/lib/pool-week";
import { AllPicksClient } from "./AllPicksClient";

export default async function AllPicksPage() {
  const session = await auth();
  return (
    <AppShell playerName={session?.user?.playerName}>
      <AllPicksClient initialWindow={getPoolWindow()} />
    </AppShell>
  );
}
