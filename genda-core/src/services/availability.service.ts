import { PoolClient } from 'pg';
import { pool } from '../config/db';
import {
  getDayOfWeekFromDate,
  intervalsOverlap,
  minutesToTime,
  timeToMinutes,
} from '../utils/time';

export interface SlotOption {
  time: string;
  available: boolean;
}

export async function getAvailableSlotsForDate(params: {
  establishmentId: string;
  date: string;
  durationMinutes: number;
  slotIntervalMinutes: number;
  client?: PoolClient;
}): Promise<SlotOption[]> {
  const runner = params.client || pool;
  const dayOfWeek = getDayOfWeekFromDate(params.date);

  const whRes = await runner.query<{
    is_open: boolean;
    open_time: string;
    close_time: string;
    break_start: string | null;
    break_end: string | null;
  }>(
    `SELECT is_open, open_time::text, close_time::text, break_start::text, break_end::text
     FROM public.working_hours
     WHERE establishment_id = $1 AND day_of_week = $2`,
    [params.establishmentId, dayOfWeek]
  );

  if (whRes.rowCount === 0 || !whRes.rows[0].is_open) {
    return [];
  }

  const wh = whRes.rows[0];
  const openMin = timeToMinutes(wh.open_time);
  const closeMin = timeToMinutes(wh.close_time);
  const breakStartMin = wh.break_start ? timeToMinutes(wh.break_start) : null;
  const breakEndMin = wh.break_end ? timeToMinutes(wh.break_end) : null;

  const blocksRes = await runner.query<{
    all_day: boolean;
    start_time: string | null;
    end_time: string | null;
  }>(
    `SELECT all_day, start_time::text, end_time::text
     FROM public.schedule_blocks
     WHERE establishment_id = $1 AND block_date = $2`,
    [params.establishmentId, params.date]
  );

  if (blocksRes.rows.some((b) => b.all_day)) {
    return [];
  }

  const blockedIntervals: Array<[number, number]> = blocksRes.rows
    .filter((b) => b.start_time && b.end_time)
    .map((b) => [timeToMinutes(b.start_time!), timeToMinutes(b.end_time!)]);

  if (breakStartMin !== null && breakEndMin !== null) {
    blockedIntervals.push([breakStartMin, breakEndMin]);
  }

  const apptRes = await runner.query<{
    start_time: string;
    end_time: string;
  }>(
    `SELECT start_time::text, end_time::text
     FROM public.appointments
     WHERE establishment_id = $1
       AND appointment_date = $2
       AND status IN ('confirmed', 'completed')`,
    [params.establishmentId, params.date]
  );

  const busyIntervals: Array<[number, number]> = [
    ...blockedIntervals,
    ...apptRes.rows.map(
      (a) => [timeToMinutes(a.start_time), timeToMinutes(a.end_time)] as [number, number]
    ),
  ];

  const slots: SlotOption[] = [];
  const step = Math.max(15, params.slotIntervalMinutes);

  for (let t = openMin; t + params.durationMinutes <= closeMin; t += step) {
    const end = t + params.durationMinutes;
    const hasConflict = busyIntervals.some(([bStart, bEnd]) =>
      intervalsOverlap(t, end, bStart, bEnd)
    );
    slots.push({
      time: minutesToTime(t),
      available: !hasConflict,
    });
  }

  return slots;
}
