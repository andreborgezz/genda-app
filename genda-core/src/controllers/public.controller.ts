import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { getEstablishmentBySlug } from '../models/establishment.model';
import { getActiveServiceById, getActiveServicesByEstablishment } from '../models/service.model';
import { getWorkingHoursByEstablishment } from '../models/workingHours.model';
import { getAvailableSlotsForDate } from '../services/availability.service';
import { BookingError, createPublicAppointment } from '../services/booking.service';

const createAppointmentSchema = z.object({
  serviceId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  clientName: z.string().trim().min(2, 'Informe seu nome completo'),
  clientWhatsapp: z.string().trim().min(8, 'Informe um WhatsApp válido'),
  notes: z.string().trim().max(500).optional(),
});

export async function getPublicEstablishment(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const slug = String(req.params.slug);
    const establishment = await getEstablishmentBySlug(slug);
    if (!establishment) {
      res.status(404).json({ error: 'Estabelecimento não encontrado.' });
      return;
    }

    const [services, workingHours] = await Promise.all([
      getActiveServicesByEstablishment(establishment.id),
      getWorkingHoursByEstablishment(establishment.id),
    ]);

    res.json({ establishment, services, workingHours });
  } catch (err) {
    next(err);
  }
}

export async function getPublicSlots(req: Request, res: Response, next: NextFunction) {
  try {
    const slug = String(req.params.slug);
    const date = String(req.query.date || '');
    const serviceId = String(req.query.serviceId || '');

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !serviceId) {
      res.status(400).json({ error: 'Parâmetros date (YYYY-MM-DD) e serviceId são obrigatórios.' });
      return;
    }

    const establishment = await getEstablishmentBySlug(slug);
    if (!establishment) {
      res.status(404).json({ error: 'Estabelecimento não encontrado.' });
      return;
    }

    const service = await getActiveServiceById(serviceId, establishment.id);
    if (!service) {
      res.status(404).json({ error: 'Serviço não encontrado ou inativo.' });
      return;
    }

    const slots = await getAvailableSlotsForDate({
      establishmentId: establishment.id,
      date,
      durationMinutes: service.duration_minutes,
      slotIntervalMinutes: establishment.slot_interval_minutes,
    });

    res.json({ date, slots });
  } catch (err) {
    next(err);
  }
}

export async function createPublicBooking(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = createAppointmentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Dados inválidos.' });
      return;
    }

    const appointment = await createPublicAppointment({
      slug: String(req.params.slug),
      ...parsed.data,
    });

    res.status(201).json({ appointment });
  } catch (err) {
    if (err instanceof BookingError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    next(err);
  }
}
