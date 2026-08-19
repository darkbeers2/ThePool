import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString && process.env.NODE_ENV !== "test") {
  console.warn("DATABASE_URL is not set");
}

const pool = new Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30_000,
});

export function getPool(): Pool {
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured");
  }
  return pool;
}
