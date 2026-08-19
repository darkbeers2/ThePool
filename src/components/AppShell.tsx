import Link from "next/link";
import { SignOutButton } from "@/components/SignOutButton";

const links = [
  { href: "/picks", label: "Player Picks" },
  { href: "/all-picks", label: "All Picks" },
  { href: "/rankings", label: "Rankings" },
];

export function AppShell({
  children,
  playerName,
}: {
  children: React.ReactNode;
  playerName?: string | null;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-slate-700/80 bg-pool-slate/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link href="/picks" className="text-lg font-semibold tracking-tight">
            The Pool
          </Link>
          <nav className="flex flex-wrap items-center gap-1 text-sm">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-md px-3 py-1.5 text-slate-200 hover:bg-slate-700/60 hover:text-white"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3 text-sm text-slate-300">
            {playerName ? (
              <span className="hidden sm:inline">{playerName}</span>
            ) : null}
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
