import { Router } from 'express';
import { z } from 'zod';
import { pool, query } from '../config/db';
import { getAvailableSlotsForDate } from '../services/availability.service';
import { minutesToTime, timeToMinutes } from '../utils/time';

export const publicRouter = Router();

const createAppointmentSchema = z.object({
  serviceId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  clientName: z.string().trim().min(2, 'Informe seu nome completo'),
  clientWhatsapp: z.string().trim().min(8, 'Informe um WhatsApp válido'),
  notes: z.string().trim().max(500).optional(),
});

publicRouter.get('/establishments/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;
    const estRes = await query(
      `SELECT id, slug, name, subtitle, bio, logo_url, banner_url, primary_color,
              address, address_complement, whatsapp,
              slot_interval_minutes, min_advance_minutes, max_future_days
       FROM public.establishments
       WHERE slug = $1`,
      [slug]
    );

    if (estRes.rowCount === 0) {
      res.status(404).json({ error: 'Estabelecimento não encontrado.' });
      return;
    }

    const establishment = estRes.rows[0];
    const [servicesRes, workingHoursRes] = await Promise.all([
      query(
        `SELECT id, name, category, description, duration_minutes, price_cents, image_url, sort_order
         FROM public.services
         WHERE establishment_id = $1 AND is_active = true
         ORDER BY sort_order ASC, created_at ASC`,
        [establishment.id]
      ),
      query(
        `SELECT day_of_week, is_open, open_time::text, close_time::text, break_start::text, break_end::text
         FROM public.working_hours
         WHERE establishment_id = $1
         ORDER BY day_of_week ASC`,
        [establishment.id]
      ),
    ]);

    res.json({
      establishment,
      services: servicesRes.rows,
      workingHours: workingHoursRes.rows,
    });
  } catch (err) {
    next(err);
  }
});

publicRouter.get('/establishments/:slug/slots', async (req, res, next) => {
  try {
    const { slug } = req.params;
    const date = String(req.query.date || '');
    const serviceId = String(req.query.serviceId || '');

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !serviceId) {
      res.status(400).json({ error: 'Parâmetros date (YYYY-MM-DD) e serviceId são obrigatórios.' });
      return;
    }

    const estRes = await query<{ id: string; slot_interval_minutes: number }>(
      `SELECT id, slot_interval_minutes FROM public.establishments WHERE slug = $1`,
      [slug]
    );
    if (estRes.rowCount === 0) {
      res.status(404).json({ error: 'Estabelecimento não encontrado.' });
      return;
    }
    const est = estRes.rows[0];

    const srvRes = await query<{ duration_minutes: number }>(
      `SELECT duration_minutes
       FROM public.services
       WHERE id = $1 AND establishment_id = $2 AND is_active = true`,
      [serviceId, est.id]
    );
    if (srvRes.rowCount === 0) {
      res.status(404).json({ error: 'Serviço não encontrado ou inativo.' });
      return;
    }

    const slots = await getAvailableSlotsForDate({
      establishmentId: est.id,
      date,
      durationMinutes: srvRes.rows[0].duration_minutes,
      slotIntervalMinutes: est.slot_interval_minutes,
    });

    res.json({ date, slots });
  } catch (err) {
    next(err);
  }
});

publicRouter.post('/establishments/:slug/appointments', async (req, res, next) => {
  const client = await pool.connect();
  try {
    const parsed = createAppointmentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Dados inválidos.' });
      return;
    }

    const { slug } = req.params;
    const { serviceId, date, startTime, clientName, clientWhatsapp, notes } = parsed.data;

    await client.query('BEGIN');

    const estRes = await client.query<{
      id: string;
      name: string;
      whatsapp: string;
      address: string;
      slot_interval_minutes: number;
    }>(
      `SELECT id, name, whatsapp, address, slot_interval_minutes
       FROM public.establishments
       WHERE slug = $1`,
      [slug]
    );
    if (estRes.rowCount === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'Estabelecimento não encontrado.' });
      return;
    }
    const est = estRes.rows[0];

    // Lock transacional por estabelecimento+data para evitar double-booking concorrente
    await client.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [`${est.id}:${date}`]);

    const srvRes = await client.query<{
      id: string;
      name: string;
      duration_minutes: number;
      price_cents: number;
    }>(
      `SELECT id, name, duration_minutes, price_cents
       FROM public.services
       WHERE id = $1 AND establishment_id = $2 AND is_active = true`,
      [serviceId, est.id]
    );
    if (srvRes.rowCount === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'Serviço não encontrado ou inativo.' });
      return;
    }
    const service = srvRes.rows[0];

    const slots = await getAvailableSlotsForDate({
      establishmentId: est.id,
      date,
      durationMinutes: service.duration_minutes,
      slotIntervalMinutes: est.slot_interval_minutes,
      client,
    });

    const chosenSlot = slots.find((s) => s.time === startTime);
    if (!chosenSlot || !chosenSlot.available) {
      await client.query('ROLLBACK');
      res.status(409).json({ error: 'Este horário não está mais disponível. Escolha outro horário.' });
      return;
    }

    const endTime = minutesToTime(timeToMinutes(startTime) + service.duration_minutes);
    const insertRes = await client.query(
      `INSERT INTO public.appointments (
         establishment_id, service_id, client_name, client_whatsapp, notes,
         appointment_date, start_time, end_time, price_cents, duration_minutes, status
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7::time, $8::time, $9, $10, 'confirmed')
       RETURNING id, appointment_date::text, start_time::text, end_time::text,
                 client_name, client_whatsapp, price_cents, duration_minutes, status, created_at`,
      [
        est.id,
        service.id,
        clientName,
        clientWhatsapp,
        notes || '',
        date,
        startTime,
        endTime,
        service.price_cents,
        service.duration_minutes,
      ]
    );

    await client.query('COMMIT');
    res.status(201).json({
      appointment: {
        ...insertRes.rows[0],
        service_name: service.name,
        establishment_name: est.name,
        establishment_whatsapp: est.whatsapp,
        establishment_address: est.address,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    next(err);
  } finally {
    client.release();
  }
});
