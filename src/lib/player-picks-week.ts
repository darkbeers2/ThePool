import type { Pool } from "pg";

/** Active week for Player Picks only (EventWeeks.ActiveWeek). */
export async function resolvePlayerPicksWeek(pool: Pool): Promise<number> {
  const envWeek = process.env.POOL_ACTIVE_WEEK;
  if (envWeek && /^\d+$/.test(envWeek)) {
    return Number.parseInt(envWeek, 10);
  }

  const active = await pool.query<{ WeekNumber: number }>(
    `SELECT "WeekNumber"
     FROM public."EventWeeks"
     WHERE "ActiveWeek" = true
     ORDER BY "WeekNumber" ASC
     LIMIT 1`,
  );
  if (active.rows[0]) {
    return active.rows[0].WeekNumber;
  }

  return 1;
}

export type PickSide = "home" | "away";

/** Stored by nulling the non-picked side's ATS column in PlayerPick. */
export function pickSideFromRow(row: {
  Home_Team_ATS: string | null;
  Away_Team_ATS: string | null;
}): PickSide | null {
  const hasHome =
    row.Home_Team_ATS != null && String(row.Home_Team_ATS).trim() !== "";
  const hasAway =
    row.Away_Team_ATS != null && String(row.Away_Team_ATS).trim() !== "";
  if (hasHome && !hasAway) return "home";
  if (hasAway && !hasHome) return "away";
  return null;
}

export function formatSpread(value: string | number | null): string {
  if (value == null || String(value).trim() === "") return "—";
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return n > 0 ? `+${n}` : String(n);
}

export function pickedTeamLabel(
  side: PickSide,
  homeName: string,
  awayName: string,
  homeAts: string | null,
  awayAts: string | null,
): string {
  if (side === "home") {
    const ats = formatSpread(homeAts);
    return ats === "—" ? homeName : `${homeName} (${ats})`;
  }
  const ats = formatSpread(awayAts);
  return ats === "—" ? awayName : `${awayName} (${ats})`;
}
