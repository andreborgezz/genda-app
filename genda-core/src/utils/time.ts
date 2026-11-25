import { env } from '../config/env';

export function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.slice(0, 5).split(':').map(Number);
  return h * 60 + m;
}

export function minutesToTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, '0');
  const m = (totalMinutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

export function intervalsOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number
): boolean {
  return aStart < bEnd && aEnd > bStart;
}

export function getDayOfWeekFromDate(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function getNowInTimezone(timeZone = env.timezone): {
  dateIso: string;
  minutesOfDay: number;
} {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date());

  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  const hour = Number(map.hour === '24' ? '0' : map.hour);
  const minute = Number(map.minute);

  return {
    dateIso: `${map.year}-${map.month}-${map.day}`,
    minutesOfDay: hour * 60 + minute,
  };
}
