"use client";

import type { PlayerPickRow } from "@/app/api/all-picks/route";
import type { PoolWindow } from "@/lib/pool-week";
import { playerPickCellBackground } from "@/lib/pick-colors";
import { useCallback, useEffect, useMemo, useState } from "react";

function formatSpread(value: string): string {
  const n = Number(value);
  if (Number.isNaN(n)) return value;
  return n > 0 ? `+${n}` : String(n);
}

function pickDisplay(
  p: PlayerPickRow,
): { name: string; ats: string } | null {
  if (p.Home_Team_ATS != null && p.Home_Team_ATS !== "") {
    return {
      name: p.Home_Team_Name ?? "Home",
      ats: formatSpread(p.Home_Team_ATS),
    };
  }
  if (p.Away_Team_ATS != null && p.Away_Team_ATS !== "") {
    return {
      name: p.Away_Team_Name ?? "Away",
      ats: formatSpread(p.Away_Team_ATS),
    };
  }
  return null;
}

export function AllPicksClient({ initialWindow }: { initialWindow: PoolWindow }) {
  const [windowState, setWindowState] = useState<PoolWindow>(initialWindow);
  const [week, setWeek] = useState<number | null>(null);
  const [picks, setPicks] = useState<PlayerPickRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshWindow = useCallback(async () => {
    const r = await fetch("/api/pool/window");
    if (r.ok) setWindowState((await r.json()) as PoolWindow);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/all-picks");
      if (r.status === 403) {
        setPicks([]);
        await refreshWindow();
        setLoading(false);
        return;
      }
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? "Failed to load");
      }
      const j = (await r.json()) as { week: number; picks: PlayerPickRow[] };
      setWeek(j.week);
      setPicks(j.picks);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [refreshWindow]);

  useEffect(() => {
    void refreshWindow();
  }, [refreshWindow]);

  useEffect(() => {
    if (windowState.kind === "reveal") {
      void load();
    } else {
      setPicks([]);
      setLoading(false);
    }
  }, [windowState.kind, load]);

  const grid = useMemo(() => {
    const byPlayer = new Map<number, { name: string; picks: PlayerPickRow[] }>();
    for (const row of picks) {
      const cur = byPlayer.get(row.FK_Player_ID);
      if (cur) {
        cur.picks.push(row);
      } else {
        byPlayer.set(row.FK_Player_ID, {
          name: row.Player_Name,
          picks: [row],
        });
      }
    }
    const players = Array.from(byPlayer.entries()).sort((a, b) =>
      a[1].name.localeCompare(b[1].name),
    );
    return players.map(([id, v]) => ({
      id,
      name: v.name,
      picks: v.picks.slice(0, 5),
    }));
  }, [picks]);

  if (windowState.kind !== "reveal") {
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-6">
        <h1 className="text-xl font-semibold">All Picks</h1>
        <p className="mt-3 text-slate-300">
          This board is visible Saturday 12:00 PM ET through Tuesday 6:00 AM ET
          the following week.
        </p>
        <p className="mt-2 text-sm text-slate-400">{windowState.label}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">All Picks</h1>
        <p className="mt-1 text-sm text-slate-400">
          Saturday 12:00 PM – Tuesday 6:00 AM (ET)
          {week != null ? ` · Week ${week}` : null}
        </p>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-slate-400">
        <Legend swatch="white" label="No results" />
        <Legend swatch="lawngreen" label="Win with lock" />
        <Legend swatch="cyan" label="Win no lock" />
        <Legend swatch="lightslategrey" label="Push" />
        <Legend swatch="yellow" label="Loss no lock" />
        <Legend swatch="pink" label="Loss with lock" />
      </div>

      {error ? (
        <div className="rounded-lg border border-red-800/60 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="text-slate-400">Loading…</p>
      ) : grid.length === 0 ? (
        <p className="text-slate-400">
          No picks found for the reveal week yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-700">
          <table className="min-w-full border-collapse border border-slate-700 text-left text-sm">
            <thead>
              <tr className="bg-slate-900/90">
                <th className="sticky left-0 z-10 border border-slate-700 bg-slate-900 px-3 py-2 font-medium text-slate-200">
                  Player
                </th>
                {[1, 2, 3, 4, 5].map((n) => (
                  <th
                    key={n}
                    className="border border-slate-700 px-3 py-2 font-medium text-slate-200"
                  >
                    Pick {n}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grid.map((row) => (
                <tr key={row.id}>
                  <td className="sticky left-0 z-10 border border-slate-700 bg-pool-navy px-3 py-2 font-medium text-slate-100">
                    {row.name}
                  </td>
                  {[0, 1, 2, 3, 4].map((i) => {
                    const p = row.picks[i];
                    if (!p) {
                      return (
                        <td
                          key={i}
                          className="border border-slate-700 align-top px-2 py-2 text-slate-500"
                          style={{ backgroundColor: "white" }}
                        >
                          —
                        </td>
                      );
                    }
                    const bg = playerPickCellBackground(p.Result);
                    const display = pickDisplay(p);
                    return (
                      <td
                        key={p.FK_Game_ID}
                        className="border border-slate-700 align-top px-2 py-2 text-xs text-slate-900"
                        style={{ backgroundColor: bg }}
                      >
                        {display ? (
                          <>
                            <div>{display.name}</div>
                            <div className="mt-0.5 font-medium">{display.ats}</div>
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-wrap gap-3 text-xs text-slate-400">
        <Legend swatch="white" label="No results" />
        <Legend swatch="lawngreen" label="Win with lock" />
        <Legend swatch="cyan" label="Win no lock" />
        <Legend swatch="lightslategrey" label="Push" />
        <Legend swatch="yellow" label="Loss no lock" />
        <Legend swatch="pink" label="Loss with lock" />
      </div>
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block h-3 w-5 rounded-sm border border-slate-600"
        style={{ backgroundColor: swatch }}
      />
      {label}
    </span>
  );
}
