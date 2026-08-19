"use client";

import type { EventRow } from "@/app/api/events/route";
import type { MyPickRow } from "@/app/api/my-picks/route";
import type { PoolWindow } from "@/lib/pool-week";
import {
  formatSpread,
  pickedTeamLabel,
  type PickSide,
} from "@/lib/player-picks-week";
import { useCallback, useEffect, useMemo, useState } from "react";

type PickDraft = {
  side: PickSide | null;
  isLock: boolean;
};

type BoardRow = EventRow & {
  isStarted: boolean;
  readOnly: boolean;
};

function fmtStartTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

type PoolWindowState = PoolWindow & { pickOpen?: boolean };

export function PicksClient({ initialWindow }: { initialWindow: PoolWindow }) {
  const [windowState, setWindowState] = useState<PoolWindowState>(initialWindow);
  const [boardRows, setBoardRows] = useState<BoardRow[]>([]);
  const [week, setWeek] = useState<number | null>(null);
  const [draft, setDraft] = useState<Record<string, PickDraft>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshWindow = useCallback(async () => {
    const r = await fetch("/api/pool/window");
    if (r.ok) setWindowState((await r.json()) as PoolWindowState);
  }, []);

  const loadPickData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const [evRes, pickRes] = await Promise.all([
        fetch("/api/events"),
        fetch("/api/my-picks"),
      ]);
      if (evRes.status === 403 || pickRes.status === 403) {
        setBoardRows([]);
        setDraft({});
        await refreshWindow();
        setLoading(false);
        return;
      }
      if (!evRes.ok) {
        const j = await evRes.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? "Failed to load games");
      }
      if (!pickRes.ok) {
        const j = await pickRes.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? "Failed to load picks");
      }

      const evJson = (await evRes.json()) as { week: number; events: EventRow[] };
      const pickJson = (await pickRes.json()) as { week: number; picks: MyPickRow[] };
      setWeek(evJson.week);

      const upcomingIds = new Set(evJson.events.map((e) => e.Game_ID));
      const startedRows: BoardRow[] = pickJson.picks
        .filter((p) => p.isStarted && !upcomingIds.has(p.FK_Game_ID))
        .map((p) => ({
          Game_ID: p.FK_Game_ID,
          FK_Week: p.FK_Week,
          Home_Team_Name: p.Home_Team_Name ?? "",
          Away_Team_Name: p.Away_Team_Name ?? "",
          Home_Team_ATS: p.Home_Team_ATS,
          Away_Team_ATS: p.Away_Team_ATS,
          Game_Start_Time: p.Game_Start_Time,
          isStarted: true,
          readOnly: true,
        }));

      const upcomingRows: BoardRow[] = evJson.events.map((e) => ({
        ...e,
        isStarted: false,
        readOnly: false,
      }));

      setBoardRows(
        [...startedRows, ...upcomingRows].sort((a, b) => {
          const byTime = a.Game_Start_Time.localeCompare(b.Game_Start_Time);
          if (byTime !== 0) return byTime;
          return a.Home_Team_Name.localeCompare(b.Home_Team_Name);
        }),
      );

      const nextDraft: Record<string, PickDraft> = {};
      for (const p of pickJson.picks) {
        nextDraft[p.FK_Game_ID] = {
          side: p.side,
          isLock: p.Is_Lock === true,
        };
      }
      setDraft(nextDraft);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [refreshWindow]);

  useEffect(() => {
    void refreshWindow();
  }, [refreshWindow]);

  const pickWindowOpen =
    windowState.pickOpen === true || windowState.kind === "pick";

  useEffect(() => {
    if (pickWindowOpen) {
      void loadPickData();
    } else {
      setLoading(false);
      setBoardRows([]);
      setDraft({});
    }
  }, [pickWindowOpen, loadPickData]);

  const pickedCount = useMemo(
    () => Object.values(draft).filter((d) => d.side != null).length,
    [draft],
  );

  const hasLock = useMemo(
    () => Object.values(draft).some((d) => d.isLock),
    [draft],
  );

  const clearPick = (gameId: string, readOnly: boolean) => {
    if (readOnly) return;
    setDraft((prev) => {
      if (!prev[gameId]?.side) return prev;
      const next = { ...prev };
      delete next[gameId];
      return next;
    });
    setMessage(null);
  };

  const setSide = (gameId: string, side: PickSide, readOnly: boolean) => {
    if (readOnly) return;
    setDraft((prev) => {
      const count = Object.values(prev).filter((d) => d.side != null).length;
      if (!prev[gameId]?.side && count >= 5) {
        setMessage("You can only select five games. Clear one pick to choose another.");
        return prev;
      }
      setMessage(null);
      return {
        ...prev,
        [gameId]: {
          side,
          isLock: prev[gameId]?.isLock ?? false,
        },
      };
    });
  };

  const setLock = (gameId: string, checked: boolean, readOnly: boolean) => {
    if (readOnly) return;
    setDraft((prev) => {
      const entry = prev[gameId];
      if (!entry?.side) return prev;
      if (checked) {
        const next: Record<string, PickDraft> = {};
        for (const [id, d] of Object.entries(prev)) {
          next[id] = { ...d, isLock: id === gameId };
        }
        return next;
      }
      return { ...prev, [gameId]: { ...entry, isLock: false } };
    });
  };

  const canSubmit = pickedCount === 5 && !saving && pickWindowOpen;

  const submit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const picks = Object.entries(draft)
        .filter(([, d]) => d.side != null)
        .map(([gameId, d]) => ({
          gameId,
          side: d.side as PickSide,
          isLock: d.isLock,
        }));
      if (picks.length !== 5) {
        throw new Error("Select exactly five games with a home or away team.");
      }
      const r = await fetch("/api/my-picks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ picks }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        throw new Error((j as { error?: string }).error ?? "Save failed");
      }
      setMessage("Your five picks are saved for this week.");
      await loadPickData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const selectedSummary = useMemo(() => {
    return Object.entries(draft)
      .filter(([, d]) => d.side != null)
      .map(([gameId, d]) => {
        const row = boardRows.find((r) => r.Game_ID === gameId);
        if (!row || !d.side) return null;
        return {
          gameId,
          startTime: row.Game_Start_Time,
          label: pickedTeamLabel(
            d.side,
            row.Home_Team_Name,
            row.Away_Team_Name,
            row.Home_Team_ATS,
            row.Away_Team_ATS,
          ),
          isLock: d.isLock,
          readOnly: row.readOnly,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item != null)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [draft, boardRows]);

  const headerNote = useMemo(() => {
    if (!pickWindowOpen) {
      return `Picks open Wednesday 12:00 PM – Saturday 12:00 PM (ET). Currently: ${windowState.label}.`;
    }
    return "Wednesday 12:00 PM – Saturday 12:00 PM (ET)";
  }, [pickWindowOpen, windowState.label]);

  if (!pickWindowOpen) {
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-6">
        <h1 className="text-xl font-semibold">Player Picks</h1>
        <p className="mt-3 text-slate-300">{headerNote}</p>
        <p className="mt-2 text-sm text-slate-400">
          During the pick window, choose five games and pick the home or away
          team for each. You may designate one pick as a lock.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Player Picks</h1>
        <p className="mt-1 text-sm text-slate-400">
          {headerNote}
          {week != null ? ` · Week ${week}` : null}
        </p>
        <p className="mt-2 text-sm text-slate-400">
          Pick home or away for exactly five games. One lock allowed. For games
          that have not started, click Clear or click the selected team again to
          remove a pick.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-800/60 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      ) : null}
      {message ? (
        <div className="rounded-lg border border-emerald-800/60 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-100">
          {message}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-3">
        <p className="text-sm text-slate-300">
          Picks:{" "}
          <span className="font-semibold text-white">{pickedCount} / 5</span>
          {hasLock ? (
            <span className="ml-3 text-amber-300">· 1 lock selected</span>
          ) : null}
        </p>
        <button
          type="button"
          disabled={!canSubmit}
          onClick={() => void submit()}
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? "Saving…" : "Save picks"}
        </button>
      </div>

      {loading ? (
        <p className="text-slate-400">Loading games…</p>
      ) : boardRows.length === 0 ? (
        <p className="text-slate-400">
          No games found for the active week. Check{" "}
          <code className="text-xs">EventWeeks</code> and{" "}
          <code className="text-xs">Events</code>.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-700">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-900/80 text-xs uppercase tracking-wide text-slate-400">
                <th className="px-3 py-2">Start time</th>
                <th className="px-2 py-2 text-center">Lock</th>
                <th className="px-2 py-2 text-center">Clear</th>
                <th className="px-2 py-2 text-center">Home</th>
                <th className="px-3 py-2">Home team</th>
                <th className="px-2 py-2">Home ATS</th>
                <th className="px-2 py-2 text-center">Away</th>
                <th className="px-3 py-2">Away team</th>
                <th className="px-2 py-2">Away ATS</th>
              </tr>
            </thead>
            <tbody>
              {boardRows.map((row) => {
                const entry = draft[row.Game_ID];
                const side = entry?.side ?? null;
                const isPicked = side != null;
                const rowClass = row.readOnly
                  ? "bg-slate-800/60"
                  : isPicked
                    ? "bg-sky-950/20"
                    : "";

                return (
                  <tr
                    key={row.Game_ID}
                    className={`border-b border-slate-800 ${rowClass}`}
                  >
                    <td className="whitespace-nowrap px-3 py-2 text-slate-300">
                      {fmtStartTime(row.Game_Start_Time)}
                      {row.readOnly ? (
                        <span className="ml-2 text-xs text-amber-400">
                          Started
                        </span>
                      ) : null}
                    </td>
                    <td className="px-2 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={entry?.isLock ?? false}
                        disabled={row.readOnly || !isPicked}
                        onChange={(e) =>
                          setLock(row.Game_ID, e.target.checked, row.readOnly)
                        }
                        aria-label={`Lock ${row.Home_Team_Name} vs ${row.Away_Team_Name}`}
                        className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-sky-500 disabled:opacity-40"
                      />
                    </td>
                    <td className="px-2 py-2 text-center">
                      {isPicked && !row.readOnly ? (
                        <button
                          type="button"
                          onClick={() => clearPick(row.Game_ID, row.readOnly)}
                          className="rounded px-2 py-0.5 text-xs text-slate-400 hover:bg-slate-800 hover:text-white"
                          aria-label={`Clear pick for ${row.Home_Team_Name} vs ${row.Away_Team_Name}`}
                        >
                          Clear
                        </button>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-2 py-2 text-center">
                      <input
                        type="radio"
                        name={`pick-${row.Game_ID}`}
                        checked={side === "home"}
                        disabled={row.readOnly}
                        onClick={() => {
                          if (!row.readOnly && side === "home") {
                            clearPick(row.Game_ID, row.readOnly);
                          }
                        }}
                        onChange={() =>
                          setSide(row.Game_ID, "home", row.readOnly)
                        }
                        aria-label={`Pick home ${row.Home_Team_Name}`}
                        className="h-4 w-4 border-slate-600 bg-slate-900 text-sky-500 disabled:opacity-40"
                      />
                    </td>
                    <td className="px-3 py-2 font-medium text-slate-100">
                      {row.Home_Team_Name}
                    </td>
                    <td className="px-2 py-2 text-slate-300">
                      {formatSpread(row.Home_Team_ATS)}
                    </td>
                    <td className="px-2 py-2 text-center">
                      <input
                        type="radio"
                        name={`pick-${row.Game_ID}`}
                        checked={side === "away"}
                        disabled={row.readOnly}
                        onClick={() => {
                          if (!row.readOnly && side === "away") {
                            clearPick(row.Game_ID, row.readOnly);
                          }
                        }}
                        onChange={() =>
                          setSide(row.Game_ID, "away", row.readOnly)
                        }
                        aria-label={`Pick away ${row.Away_Team_Name}`}
                        className="h-4 w-4 border-slate-600 bg-slate-900 text-sky-500 disabled:opacity-40"
                      />
                    </td>
                    <td className="px-3 py-2 font-medium text-slate-100">
                      {row.Away_Team_Name}
                    </td>
                    <td className="px-2 py-2 text-slate-300">
                      {formatSpread(row.Away_Team_ATS)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedSummary.length > 0 && !loading ? (
        <div className="rounded-lg border border-slate-700/80 bg-slate-900/30 p-4">
          <p className="text-sm font-medium text-slate-200">Your selections</p>
          <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-slate-300">
            {selectedSummary.map((item) => (
              <li key={item.gameId}>
                {item.label}
                {item.isLock ? (
                  <span className="ml-2 font-semibold text-amber-300">LOCK</span>
                ) : null}
                {item.readOnly ? (
                  <span className="ml-2 text-xs text-slate-500">(read-only)</span>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </div>
  );
}
