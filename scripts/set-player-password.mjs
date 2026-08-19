import 'dotenv/config';
/**
 * Set or update a 'player's site-login password (bcrypt hash in DB).
 * Usage: node scripts/set-player-password.mjs <username> <password> [displayName] [email]
 */
import pg from "pg";
import bcrypt from "bcryptjs";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnvLocal() {
  const path = resolve(root, ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] == null) process.env[key] = val;
  }
}

loadEnvLocal();

const [username, password, displayName, email] = process.argv.slice(2);
if (!username || !password) {
  console.error(
    "Usage: node scripts/set-player-password.mjs <username> <password> [displayName] [email]",
  );
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const hash = await bcrypt.hash(password, 12);

try {
  const existing = await pool.query(
    `SELECT "Player_ID", "Player_Name", "Player_Email"
     FROM public."Players"
     WHERE lower("Player_Username") = lower($1)
        OR lower("Player_Email") = lower($1)
     LIMIT 1`,
    [username],
  );

  if (existing.rows[0]) {
    const row = existing.rows[0];
    await pool.query(
      `UPDATE public."Players"
       SET "Player_Username" = $1,
           "Player_Password_Hash" = $2
       WHERE "Player_ID" = $3`,
      [username, hash, row.Player_ID],
    );
    console.log(`Updated password for player ${row.Player_Name} (${row.Player_Email})`);
  } else {
    const name = displayName ?? username;
    const playerEmail = email ?? `${username}@thepool.local`;
    await pool.query(
      `INSERT INTO public."Players"
         ("Player_Name", "Player_Email", "Player_Username", "Player_Password_Hash")
       VALUES ($1, $2, $3, $4)`,
      [name, playerEmail, username, hash],
    );
    console.log(`Created player ${name} with username ${username}`);
  }
} finally {
  await pool.end();
}
