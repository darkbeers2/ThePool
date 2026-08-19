import type { Pool } from "pg";

/**
 * Resolves which FK_Week the pool UI should use.
 * Optional POOL_ACTIVE_WEEK env overrides automatic detection.
 */
export async function resolveActiveWeek(pool: Pool): Promise<number> {
  const envWeek = process.env.POOL_ACTIVE_WEEK;
  if (envWeek && /^\d+$/.test(envWeek)) {
    return Number.parseInt(envWeek, 10);
  }

  const upcoming = await pool.query<{ FK_Week: number }>(
    `SELECT "FK_Week"
     FROM public."Events"
     GROUP BY "FK_Week"
     HAVING MIN("Game_Start_Time") > NOW()
     ORDER BY MIN("Game_Start_Time") ASC
     LIMIT 1`,
  );
  if (upcoming.rows[0]) {
    return upcoming.rows[0].FK_Week;
  }

  const latest = await pool.query<{ m: number | null }>(
    `SELECT MAX("FK_Week") AS m FROM public."Events"`,
  );
  if (latest.rows[0]?.m != null) {
    return latest.rows[0].m;
  }

  const fromPicks = await pool.query<{ m: number | null }>(
    `SELECT MAX("FK_Week") AS m FROM public."PlayerPick"`,
  );
  if (fromPicks.rows[0]?.m != null) {
    return fromPicks.rows[0].m;
  }

  return 1;
}

/** Week shown on All Picks during reveal: latest week present in PlayerPick, else active from Events */
export async function resolveRevealWeek(pool: Pool): Promise<number> {
  const envWeek = process.env.POOL_ACTIVE_WEEK;
  if (envWeek && /^\d+$/.test(envWeek)) {
    return Number.parseInt(envWeek, 10);
  }

  const fromPicks = await pool.query<{ m: number | null }>(
    `SELECT MAX("FK_Week") AS m FROM public."PlayerPick"`,
  );
  if (fromPicks.rows[0]?.m != null) {
    return fromPicks.rows[0].m;
  }

  return resolveActiveWeek(pool);
}
