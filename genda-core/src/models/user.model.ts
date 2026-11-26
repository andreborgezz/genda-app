import { query } from '../config/db';
import type { UserRow } from '../types/genda.types';

export async function getUserByEmail(email: string): Promise<UserRow | null> {
  const result = await query<UserRow>(
    `SELECT id, establishment_id, name, email, password_hash, plan_name, plan_status
     FROM public.users
     WHERE lower(email) = lower($1)`,
    [email.trim()]
  );
  return result.rows[0] ?? null;
}

export async function getUserById(id: string): Promise<Omit<UserRow, 'password_hash'> | null> {
  const result = await query<Omit<UserRow, 'password_hash'>>(
    `SELECT id, establishment_id, name, email, plan_name, plan_status
     FROM public.users
     WHERE id = $1`,
    [id]
  );
  return result.rows[0] ?? null;
}

export async function updateUserPasswordHash(
  userId: string,
  passwordHash: string
): Promise<void> {
  await query(
    `UPDATE public.users
     SET password_hash = $2, updated_at = now()
     WHERE id = $1`,
    [userId, passwordHash]
  );
}
