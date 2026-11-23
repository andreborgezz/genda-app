import { PoolClient } from 'pg';
import { pool, query } from '../config/db';
import type { AppointmentRow, AppointmentStatus } from '../types/genda.types';

export async function getActiveAppointmentIntervals(
  establishmentId: string,
  date: string,
  client?: PoolClient
): Promise<Array<{ start_time: string; end_time: string }>> {
  const runner = client || pool;
  const result = await runner.query<{ start_time: string; end_time: string }>(
    `SELECT start_time::text, end_time::text
     FROM public.appointments
     WHERE establishment_id = $1
       AND appointment_date = $2
       AND status IN ('confirmed', 'completed')`,
    [establishmentId, date]
  );
  return result.rows;
}

export async function getAppointmentsByEstablishment(
  establishmentId: string,
  date: string | null
): Promise<AppointmentRow[]> {
  const result = await query<AppointmentRow>(
    `SELECT a.id, a.service_id, s.name AS service_name, s.category AS service_category,
            a.client_name, a.client_whatsapp, a.notes,
            a.appointment_date::text, a.start_time::text, a.end_time::text,
            a.price_cents, a.duration_minutes, a.status, a.created_at
     FROM public.appointments a
     JOIN public.services s ON s.id = a.service_id
     WHERE a.establishment_id = $1
       AND ($2::date IS NULL OR a.appointment_date = $2::date)
     ORDER BY a.appointment_date ASC, a.start_time ASC`,
    [establishmentId, date]
  );
  return result.rows;
}

export async function insertAppointment(
  client: PoolClient,
  data: {
    establishmentId: string;
    serviceId: string;
    clientName: string;
    clientWhatsapp: string;
    notes: string;
    date: string;
    startTime: string;
    endTime: string;
    priceCents: number;
    durationMinutes: number;
  }
): Promise<AppointmentRow> {
  const result = await client.query<AppointmentRow>(
    `INSERT INTO public.appointments (
       establishment_id, service_id, client_name, client_whatsapp, notes,
       appointment_date, start_time, end_time, price_cents, duration_minutes, status
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7::time, $8::time, $9, $10, 'confirmed')
     RETURNING id, service_id, appointment_date::text, start_time::text, end_time::text,
               client_name, client_whatsapp, notes, price_cents, duration_minutes, status, created_at`,
    [
      data.establishmentId,
      data.serviceId,
      data.clientName,
      data.clientWhatsapp,
      data.notes,
      data.date,
      data.startTime,
      data.endTime,
      data.priceCents,
      data.durationMinutes,
    ]
  );
  return result.rows[0];
}

export async function updateAppointmentStatusById(
  id: string,
  status: AppointmentStatus
): Promise<{ id: string; status: AppointmentStatus } | null> {
  const result = await query<{ id: string; status: AppointmentStatus }>(
    `UPDATE public.appointments
     SET status = $2, updated_at = now()
     WHERE id = $1
     RETURNING id, status`,
    [id, status]
  );
  return result.rows[0] ?? null;
}
