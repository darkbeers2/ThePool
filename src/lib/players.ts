import type { Pool } from "pg";
import bcrypt from "bcryptjs";

export type PlayerRow = {
  Player_ID: number;
  Player_Name: string;
  Player_Email: string;
  Player_Username?: string | null;
  Player_Password_Hash?: string | null;
};

const playerColumns = `"Player_ID", "Player_Name", "Player_Email", "Player_Username", "Player_Password_Hash"`;

export async function findPlayerByEmail(
  pool: Pool,
  email: string,
): Promise<PlayerRow | null> {
  const { rows } = await pool.query<PlayerRow>(
    `SELECT ${playerColumns}
     FROM public."Players"
     WHERE lower("Player_Email") = lower($1)
     LIMIT 1`,
    [email],
  );
  return rows[0] ?? null;
}

export async function findPlayerByLogin(
  pool: Pool,
  login: string,
): Promise<PlayerRow | null> {
  const { rows } = await pool.query<PlayerRow>(
    `SELECT ${playerColumns}
     FROM public."Players"
     WHERE lower("Player_Username") = lower($1)
        OR lower("Player_Email") = lower($1)
     LIMIT 1`,
    [login],
  );
  return rows[0] ?? null;
}

export async function verifyPlayerCredentials(
  pool: Pool,
  login: string,
  password: string,
): Promise<PlayerRow | null> {
  const player = await findPlayerByLogin(pool, login);
  if (!player?.Player_Password_Hash) {
    return null;
  }
  const ok = await bcrypt.compare(password, player.Player_Password_Hash);
  return ok ? player : null;
}

export async function getPlayerForGoogleLogin(
  pool: Pool,
  params: { email: string; name: string },
): Promise<PlayerRow | null> {
  const existing = await findPlayerByEmail(pool, params.email);
  if (!existing) {
    return null;
  }

  if (existing.Player_Name !== params.name) {
    await pool.query(
      `UPDATE public."Players" SET "Player_Name" = $1 WHERE "Player_ID" = $2`,
      [params.name, existing.Player_ID],
    );
    return { ...existing, Player_Name: params.name };
  }

  return existing;
}
