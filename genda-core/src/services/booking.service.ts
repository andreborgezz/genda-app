import { pool } from '../config/db';
import { insertAppointment } from '../models/appointment.model';
import { getEstablishmentBySlug } from '../models/establishment.model';
import { getActiveServiceById } from '../models/service.model';
import { minutesToTime, timeToMinutes } from '../utils/time';
import { getAvailableSlotsForDate } from './availability.service';

export class BookingError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export async function createPublicAppointment(params: {
  slug: string;
  serviceId: string;
  date: string;
  startTime: string;
  clientName: string;
  clientWhatsapp: string;
  notes?: string;
}) {
  const est = await getEstablishmentBySlug(params.slug);
  if (!est) {
    throw new BookingError(404, 'Estabelecimento não encontrado.');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [`${est.id}:${params.date}`]);

    const service = await getActiveServiceById(params.serviceId, est.id, client);
    if (!service) {
      throw new BookingError(404, 'Serviço não encontrado ou inativo.');
    }

    const slots = await getAvailableSlotsForDate({
      establishmentId: est.id,
      date: params.date,
      durationMinutes: service.duration_minutes,
      slotIntervalMinutes: est.slot_interval_minutes,
      client,
    });

    const chosenSlot = slots.find((s) => s.time === params.startTime);
    if (!chosenSlot || !chosenSlot.available) {
      throw new BookingError(
        409,
        'Este horário não está mais disponível. Escolha outro horário.'
      );
    }

    const endTime = minutesToTime(timeToMinutes(params.startTime) + service.duration_minutes);
    const appointment = await insertAppointment(client, {
      establishmentId: est.id,
      serviceId: service.id,
      clientName: params.clientName,
      clientWhatsapp: params.clientWhatsapp,
      notes: params.notes || '',
      date: params.date,
      startTime: params.startTime,
      endTime,
      priceCents: service.price_cents,
      durationMinutes: service.duration_minutes,
    });

    await client.query('COMMIT');
    return {
      ...appointment,
      service_name: service.name,
      establishment_name: est.name,
      establishment_whatsapp: est.whatsapp,
      establishment_address: est.address,
    };
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}
