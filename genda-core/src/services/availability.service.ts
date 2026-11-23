import { PoolClient } from 'pg';
import { getActiveAppointmentIntervals } from '../models/appointment.model';
import { getScheduleBlocksByDate } from '../models/scheduleBlock.model';
import { getWorkingHourByDay } from '../models/workingHours.model';
import type { SlotOption } from '../types/genda.types';
import {
  getDayOfWeekFromDate,
  intervalsOverlap,
  minutesToTime,
  timeToMinutes,
} from '../utils/time';

export async function getAvailableSlotsForDate(params: {
  establishmentId: string;
  date: string;
  durationMinutes: number;
  slotIntervalMinutes: number;
  client?: PoolClient;
}): Promise<SlotOption[]> {
  const dayOfWeek = getDayOfWeekFromDate(params.date);
  const wh = await getWorkingHourByDay(params.establishmentId, dayOfWeek, params.client);

  if (!wh || !wh.is_open) {
    return [];
  }

  const openMin = timeToMinutes(wh.open_time);
  const closeMin = timeToMinutes(wh.close_time);
  const breakStartMin = wh.break_start ? timeToMinutes(wh.break_start) : null;
  const breakEndMin = wh.break_end ? timeToMinutes(wh.break_end) : null;

  const blocks = await getScheduleBlocksByDate(params.establishmentId, params.date, params.client);
  if (blocks.some((b) => b.all_day)) {
    return [];
  }

  const blockedIntervals: Array<[number, number]> = blocks
    .filter((b) => b.start_time && b.end_time)
    .map((b) => [timeToMinutes(b.start_time!), timeToMinutes(b.end_time!)]);

  if (breakStartMin !== null && breakEndMin !== null) {
    blockedIntervals.push([breakStartMin, breakEndMin]);
  }

  const appointments = await getActiveAppointmentIntervals(
    params.establishmentId,
    params.date,
    params.client
  );

  const busyIntervals: Array<[number, number]> = [
    ...blockedIntervals,
    ...appointments.map(
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
