import { query } from '../config/db';

export async function createPasswordResetToken(
  userId: string,
  tokenHash: string,
  expiresAt: Date
): Promise<void> {
  await query(
    `INSERT INTO public.password_reset_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, tokenHash, expiresAt.toISOString()]
  );
}

export async function findValidToken(
  tokenHash: string
): Promise<{ id: string; user_id: string } | null> {
  const result = await query<{ id: string; user_id: string }>(
    `SELECT id, user_id
     FROM public.password_reset_tokens
     WHERE token_hash = $1
       AND used = false
       AND expires_at > now()
     LIMIT 1`,
    [tokenHash]
  );
  return result.rows[0] ?? null;
}

export async function markTokenAsUsed(id: string): Promise<void> {
  await query(
    `UPDATE public.password_reset_tokens
     SET used = true
     WHERE id = $1`,
    [id]
  );
}

export async function deleteExpiredTokensForUser(userId: string): Promise<void> {
  await query(
    `DELETE FROM public.password_reset_tokens
     WHERE user_id = $1
       AND (expires_at <= now() OR used = true)`,
    [userId]
  );
}
