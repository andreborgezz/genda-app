import { PoolClient } from 'pg';
import { pool, query } from '../config/db';
import type { WorkingHourRow } from '../types/genda.types';

export async function getWorkingHoursByEstablishment(
  establishmentId: string
): Promise<WorkingHourRow[]> {
  const result = await query<WorkingHourRow>(
    `SELECT day_of_week, is_open, open_time::text, close_time::text,
            break_start::text, break_end::text
     FROM public.working_hours
     WHERE establishment_id = $1
     ORDER BY day_of_week ASC`,
    [establishmentId]
  );
  return result.rows;
}

export async function getWorkingHourByDay(
  establishmentId: string,
  dayOfWeek: number,
  client?: PoolClient
): Promise<WorkingHourRow | null> {
  const runner = client || pool;
  const result = await runner.query<WorkingHourRow>(
    `SELECT day_of_week, is_open, open_time::text, close_time::text,
            break_start::text, break_end::text
     FROM public.working_hours
     WHERE establishment_id = $1 AND day_of_week = $2`,
    [establishmentId, dayOfWeek]
  );
  return result.rows[0] ?? null;
}

export async function upsertWorkingHours(
  establishmentId: string,
  workingHours: WorkingHourRow[]
): Promise<WorkingHourRow[]> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const wh of workingHours) {
      await client.query(
        `INSERT INTO public.working_hours (
           establishment_id, day_of_week, is_open, open_time, close_time, break_start, break_end
         ) VALUES ($1, $2, $3, $4::time, $5::time, $6::time, $7::time)
         ON CONFLICT (establishment_id, day_of_week)
         DO UPDATE SET
           is_open = EXCLUDED.is_open,
           open_time = EXCLUDED.open_time,
           close_time = EXCLUDED.close_time,
           break_start = EXCLUDED.break_start,
           break_end = EXCLUDED.break_end,
           updated_at = now()`,
        [
          establishmentId,
          wh.day_of_week,
          wh.is_open,
          wh.open_time.slice(0, 5),
          wh.close_time.slice(0, 5),
          wh.break_start ? wh.break_start.slice(0, 5) : null,
          wh.break_end ? wh.break_end.slice(0, 5) : null,
        ]
      );
    }
    await client.query('COMMIT');
    return getWorkingHoursByEstablishment(establishmentId);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}
