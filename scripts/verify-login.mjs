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

const [login, password] = process.argv.slice(2);
if (!login || !password) {
  console.error("Usage: node scripts/verify-login.mjs <login> <password>");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

try {
  const { rows } = await pool.query(
    `SELECT "Player_ID", "Player_Name", "Player_Username", "Player_Email",
            "Player_Password_Hash"
     FROM public."Players"
     WHERE lower("Player_Username") = lower($1)
        OR lower("Player_Email") = lower($1)
     LIMIT 1`,
    [login],
  );

  const player = rows[0];
  if (!player) {
    console.log("FAIL: no player found for login:", login);
    process.exit(1);
  }

  console.log("Found player:", {
    id: player.Player_ID,
    name: player.Player_Name,
    username: player.Player_Username,
    email: player.Player_Email,
    hasHash: Boolean(player.Player_Password_Hash),
  });

  if (!player.Player_Password_Hash) {
    console.log("FAIL: no password hash stored");
    process.exit(1);
  }

  const ok = await bcrypt.compare(password, player.Player_Password_Hash);
  console.log(ok ? "PASS: password matches" : "FAIL: password does not match");
  process.exit(ok ? 0 : 1);
} finally {
  await pool.end();
}
