import { PoolClient } from 'pg';
import { pool, query } from '../config/db';
import type { ScheduleBlockRow } from '../types/genda.types';

export async function getScheduleBlocksByDate(
  establishmentId: string,
  date: string,
  client?: PoolClient
): Promise<Pick<ScheduleBlockRow, 'all_day' | 'start_time' | 'end_time'>[]> {
  const runner = client || pool;
  const result = await runner.query<
    Pick<ScheduleBlockRow, 'all_day' | 'start_time' | 'end_time'>
  >(
    `SELECT all_day, start_time::text, end_time::text
     FROM public.schedule_blocks
     WHERE establishment_id = $1 AND block_date = $2`,
    [establishmentId, date]
  );
  return result.rows;
}

export async function getUpcomingScheduleBlocks(
  establishmentId: string
): Promise<ScheduleBlockRow[]> {
  const result = await query<ScheduleBlockRow>(
    `SELECT id, block_date::text, start_time::text, end_time::text, all_day, reason
     FROM public.schedule_blocks
     WHERE establishment_id = $1 AND block_date >= CURRENT_DATE - INTERVAL '7 days'
     ORDER BY block_date ASC, start_time ASC`,
    [establishmentId]
  );
  return result.rows;
}

export async function createScheduleBlock(
  establishmentId: string,
  data: {
    block_date: string;
    all_day: boolean;
    start_time?: string | null;
    end_time?: string | null;
    reason: string;
  }
): Promise<ScheduleBlockRow> {
  const result = await query<ScheduleBlockRow>(
    `INSERT INTO public.schedule_blocks (establishment_id, block_date, all_day, start_time, end_time, reason)
     VALUES ($1, $2, $3, $4::time, $5::time, $6)
     RETURNING id, block_date::text, start_time::text, end_time::text, all_day, reason`,
    [
      establishmentId,
      data.block_date,
      data.all_day,
      data.start_time ?? null,
      data.end_time ?? null,
      data.reason,
    ]
  );
  return result.rows[0];
}

export async function deleteScheduleBlockById(id: string): Promise<void> {
  await query(`DELETE FROM public.schedule_blocks WHERE id = $1`, [id]);
}
