import { getPool } from "@/lib/db";

export type ChampionByYearRow = {
  Year: number | string;
  Rank: string;
  Winners: string | null;
};

export type ChampionByPlayerRow = {
  Name: string;
  Year: number | string;
  Rank: string;
};

export async function getChampionsByYear() {
  const pool = getPool();
  const { rows } = await pool.query<ChampionByYearRow>(
    `SELECT "Year",
            CASE
              WHEN "Place" = 1 THEN '1st Place'
              WHEN "Place" = 2 THEN '2nd Place'
              WHEN "Place" = 3 THEN '3rd Place'
              ELSE '4th Place'
            END AS "Rank",
            STRING_AGG("Name", ', ') AS "Winners"
     FROM public."Champions"
     GROUP BY "Year", "Place"
     ORDER BY "Year" ASC, "Place" ASC`,
  );
  return rows;
}

export async function getChampionsByPlayer() {
  const pool = getPool();
  const { rows } = await pool.query<ChampionByPlayerRow>(
    `SELECT "Name",
            "Year",
            CASE
              WHEN "Place" = 1 THEN '1st Place'
              WHEN "Place" = 2 THEN '2nd Place'
              WHEN "Place" = 3 THEN '3rd Place'
              ELSE '4th Place'
            END AS "Rank"
     FROM public."Champions"
     WHERE "Name" NOT IN ('-')
     ORDER BY "Name" ASC, "Year" ASC, "Rank" ASC`,
  );
  return rows;
}
