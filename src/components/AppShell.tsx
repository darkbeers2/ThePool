import Link from "next/link";
import { SignOutButton } from "@/components/SignOutButton";

const links: {
  href: string;
  label: string;
  icon?: "trophy";
}[] = [
  { href: "/picks", label: "Player Picks" },
  { href: "/all-picks", label: "All Picks" },
  { href: "/rankings", label: "Rankings" },
  { href: "/champions", label: "Champions", icon: "trophy" },
];

function TrophyIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-5 w-5"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 0 0-.584.859 6.753 6.753 0 0 0 6.138 5.6 6.73 6.73 0 0 0 2.743 1.346A6.707 6.707 0 0 1 9.279 15H8.54c-1.036 0-1.875.84-1.875 1.875V19.5h12.75v-2.625c0-1.036-.84-1.875-1.875-1.875h-.739a6.706 6.706 0 0 1-1.112-3.173 6.73 6.73 0 0 0 2.743-1.347 6.753 6.753 0 0 0 6.139-5.6.75.75 0 0 0-.585-.858 47.077 47.077 0 0 0-3.07-.543V2.62a.75.75 0 0 0-.658-.744 49.22 49.22 0 0 0-6.093-.377c-2.063 0-4.096.128-6.093.377a.75.75 0 0 0-.657.744Zm0 2.629c0 1.3.171 2.585.502 3.767a4.504 4.504 0 0 1-1.355-.165A5.253 5.253 0 0 1 5.166 5.25Zm14.17 3.767A12.76 12.76 0 0 0 20.334 5.25a5.253 5.253 0 0 1-1.147 3.767 4.504 4.504 0 0 1-1.354.165Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

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
            Kohler&apos;s CFB ATS
          </Link>
          <nav className="flex flex-wrap items-center gap-1 text-sm">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-label={l.icon ? l.label : undefined}
                title={l.icon ? l.label : undefined}
                className={
                  l.icon
                    ? "rounded-md px-2.5 py-1.5 text-amber-300 hover:bg-slate-700/60 hover:text-amber-200"
                    : "rounded-md px-3 py-1.5 text-slate-200 hover:bg-slate-700/60 hover:text-white"
                }
              >
                {l.icon === "trophy" ? <TrophyIcon /> : l.label}
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
