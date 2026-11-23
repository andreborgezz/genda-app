import { Pool, QueryResultRow } from 'pg';
import { env } from './env';

if (!env.databaseUrl) {
  throw new Error('DATABASE_URL não configurada no ambiente.');
}

export const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: env.databaseSsl ? { rejectUnauthorized: false } : undefined,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
) {
  return pool.query<T>(text, params);
}
