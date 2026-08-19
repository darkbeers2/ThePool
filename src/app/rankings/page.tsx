import { AppShell } from "@/components/AppShell";
import { auth } from "@/auth";
import { RankingsClient } from "./RankingsClient";

export default async function RankingsPage() {
  const session = await auth();
  return (
    <AppShell playerName={session?.user?.playerName}>
      <RankingsClient />
    </AppShell>
  );
}
