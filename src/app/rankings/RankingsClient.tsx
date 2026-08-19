"use client";

import type { SummaryRow } from "@/app/api/rankings/route";
import { useEffect, useState } from "react";

const weekColumns: (keyof SummaryRow)[] = [
  "Week1",
  "Week2",
  "Week3",
  "Week4",
  "Week5",
  "Week6",
  "Week7",
  "Week8",
  "Week9",
  "Week10",
  "Week11",
  "Week12",
  "Week13",
  "Week14",
  "Week15",
  "BowlWeek",
  "NC",
];

export function RankingsClient() {
  const [rows, setRows] = useState<SummaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const r = await fetch("/api/rankings");
        const j = await r.json().catch(() => ({}));
        if (!r.ok) {
          throw new Error((j as { error?: string }).error ?? "Failed to load");
        }
        if (!cancelled) {
          setRows((j as { rows: SummaryRow[] }).rows ?? []);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Error");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <p className="text-slate-400">Loading standings…</p>;
  }
  if (error) {
    return (
      <div className="rounded-lg border border-red-800/60 bg-red-950/40 px-3 py-2 text-sm text-red-200">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Rankings</h1>
        <p className="mt-1 text-sm text-slate-400">
          Sorted by overall rank, then player name.
        </p>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-700">
        <table className="min-w-full border-collapse border border-slate-700 text-left text-xs sm:text-sm">
          <thead>
            <tr className="bg-slate-900/90">
              <th className="sticky left-0 z-10 border border-slate-700 bg-slate-900 px-2 py-2 font-medium text-slate-200">
                Player
              </th>
              <th className="border border-slate-700 px-2 py-2 font-medium text-slate-200">
                Rank
              </th>
              <th className="border border-slate-700 px-2 py-2 font-medium text-slate-200">
                Total
              </th>
              {weekColumns.map((c) => (
                <th
                  key={c}
                  className="border border-slate-700 px-2 py-2 font-medium text-slate-200"
                >
                  {c}
                </th>
              ))}
              <th className="border border-slate-700 px-2 py-2 font-medium text-slate-200">
                Total
              </th>
              <th className="border border-slate-700 px-2 py-2 font-medium text-slate-200">
                2H
              </th>
              <th className="border border-slate-700 px-2 py-2 font-medium text-slate-200">
                2H Rnk
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.FK_Player_ID}>
                <td className="sticky left-0 z-10 border border-slate-700 bg-pool-navy px-2 py-1.5 font-medium text-slate-100">
                  {r.Player_Name}
                </td>
                <td className="border border-slate-700 px-2 py-1.5 text-right text-slate-200">
                  {r.Rank ?? "—"}
                </td>
                <td className="border border-slate-700 px-2 py-1.5 text-right font-medium text-white">
                  {r.Total ?? "—"}
                </td>
                {weekColumns.map((c) => (
                  <td
                    key={c}
                    className="border border-slate-700 px-2 py-1.5 text-right text-slate-300"
                  >
                    {(r[c] as number | null) ?? "—"}
                  </td>
                ))}
                <td className="border border-slate-700 px-2 py-1.5 text-right font-medium text-white">
                  {r.Total ?? "—"}
                </td>
                <td className="border border-slate-700 px-2 py-1.5 text-right text-slate-300">
                  {r.SecondHalf ?? "—"}
                </td>
                <td className="border border-slate-700 px-2 py-1.5 text-right text-slate-300">
                  {r.SecondHalfRank ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
