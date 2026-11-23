import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { pool, query } from '../config/db';
import { isR2Configured, uploadImageToR2 } from '../config/r2';

export const adminRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

const DEFAULT_SLUG = 'studio-aura';

async function resolveEstablishmentId(slugParam?: unknown): Promise<string | null> {
  const slug = typeof slugParam === 'string' && slugParam.trim() ? slugParam.trim() : DEFAULT_SLUG;
  const res = await query<{ id: string }>(
    `SELECT id FROM public.establishments WHERE slug = $1`,
    [slug]
  );
  if (res.rowCount && res.rows[0]) return res.rows[0].id;
  const fallback = await query<{ id: string }>(
    `SELECT id FROM public.establishments ORDER BY created_at ASC LIMIT 1`
  );
  return fallback.rows[0]?.id || null;
}

adminRouter.get('/establishment', async (req, res, next) => {
  try {
    const estId = await resolveEstablishmentId(req.query.slug);
    if (!estId) {
      res.status(404).json({ error: 'Estabelecimento não encontrado.' });
      return;
    }
    const result = await query(
      `SELECT id, slug, name, subtitle, bio, logo_url, banner_url, primary_color,
              address, address_complement, whatsapp,
              slot_interval_minutes, min_advance_minutes, max_future_days
       FROM public.establishments WHERE id = $1`,
      [estId]
    );
    res.json({ establishment: result.rows[0], r2Configured: isR2Configured() });
  } catch (err) {
    next(err);
  }
});

const updateEstablishmentSchema = z.object({
  slug: z.string().trim().min(2).regex(/^[a-z0-9-]+$/).optional(),
  name: z.string().trim().min(2).optional(),
  subtitle: z.string().trim().optional(),
  bio: z.string().trim().optional(),
  logo_url: z.string().trim().nullable().optional(),
  banner_url: z.string().trim().nullable().optional(),
  primary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  address: z.string().trim().optional(),
  address_complement: z.string().trim().optional(),
  whatsapp: z.string().trim().optional(),
  slot_interval_minutes: z.number().int().min(10).max(120).optional(),
  min_advance_minutes: z.number().int().min(0).max(1440).optional(),
  max_future_days: z.number().int().min(1).max(180).optional(),
});

adminRouter.put('/establishment', async (req, res, next) => {
  try {
    const estId = await resolveEstablishmentId(req.query.slug);
    if (!estId) {
      res.status(404).json({ error: 'Estabelecimento não encontrado.' });
      return;
    }
    const parsed = updateEstablishmentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Dados inválidos.' });
      return;
    }

    const d = parsed.data;
    const result = await query(
      `UPDATE public.establishments
       SET slug = COALESCE($2, slug),
           name = COALESCE($3, name),
           subtitle = COALESCE($4, subtitle),
           bio = COALESCE($5, bio),
           logo_url = CASE WHEN $6::boolean THEN $7 ELSE logo_url END,
           banner_url = CASE WHEN $8::boolean THEN $9 ELSE banner_url END,
           primary_color = COALESCE($10, primary_color),
           address = COALESCE($11, address),
           address_complement = COALESCE($12, address_complement),
           whatsapp = COALESCE($13, whatsapp),
           slot_interval_minutes = COALESCE($14, slot_interval_minutes),
           min_advance_minutes = COALESCE($15, min_advance_minutes),
           max_future_days = COALESCE($16, max_future_days),
           updated_at = now()
       WHERE id = $1
       RETURNING *`,
      [
        estId,
        d.slug ?? null,
        d.name ?? null,
        d.subtitle ?? null,
        d.bio ?? null,
        d.logo_url !== undefined,
        d.logo_url ?? null,
        d.banner_url !== undefined,
        d.banner_url ?? null,
        d.primary_color ?? null,
        d.address ?? null,
        d.address_complement ?? null,
        d.whatsapp ?? null,
        d.slot_interval_minutes ?? null,
        d.min_advance_minutes ?? null,
        d.max_future_days ?? null,
      ]
    );
    res.json({ establishment: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// Serviços
const serviceSchema = z.object({
  name: z.string().trim().min(2),
  category: z.string().trim().min(1).default('Geral'),
  description: z.string().trim().default(''),
  duration_minutes: z.number().int().min(10).max(480),
  price_cents: z.number().int().min(0),
  image_url: z.string().trim().nullable().optional(),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().default(0),
});

adminRouter.get('/services', async (req, res, next) => {
  try {
    const estId = await resolveEstablishmentId(req.query.slug);
    if (!estId) {
      res.status(404).json({ error: 'Estabelecimento não encontrado.' });
      return;
    }
    const result = await query(
      `SELECT * FROM public.services
       WHERE establishment_id = $1
       ORDER BY sort_order ASC, created_at ASC`,
      [estId]
    );
    res.json({ services: result.rows });
  } catch (err) {
    next(err);
  }
});

adminRouter.post('/services', async (req, res, next) => {
  try {
    const estId = await resolveEstablishmentId(req.query.slug);
    if (!estId) {
      res.status(404).json({ error: 'Estabelecimento não encontrado.' });
      return;
    }
    const parsed = serviceSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Dados inválidos.' });
      return;
    }
    const d = parsed.data;
    const result = await query(
      `INSERT INTO public.services (
         establishment_id, name, category, description, duration_minutes,
         price_cents, image_url, is_active, sort_order
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        estId,
        d.name,
        d.category,
        d.description,
        d.duration_minutes,
        d.price_cents,
        d.image_url ?? null,
        d.is_active,
        d.sort_order,
      ]
    );
    res.status(201).json({ service: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

adminRouter.put('/services/:id', async (req, res, next) => {
  try {
    const parsed = serviceSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Dados inválidos.' });
      return;
    }
    const d = parsed.data;
    const result = await query(
      `UPDATE public.services
       SET name = COALESCE($2, name),
           category = COALESCE($3, category),
           description = COALESCE($4, description),
           duration_minutes = COALESCE($5, duration_minutes),
           price_cents = COALESCE($6, price_cents),
           image_url = CASE WHEN $7::boolean THEN $8 ELSE image_url END,
           is_active = COALESCE($9, is_active),
           sort_order = COALESCE($10, sort_order),
           updated_at = now()
       WHERE id = $1
       RETURNING *`,
      [
        req.params.id,
        d.name ?? null,
        d.category ?? null,
        d.description ?? null,
        d.duration_minutes ?? null,
        d.price_cents ?? null,
        d.image_url !== undefined,
        d.image_url ?? null,
        d.is_active ?? null,
        d.sort_order ?? null,
      ]
    );
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Serviço não encontrado.' });
      return;
    }
    res.json({ service: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

adminRouter.delete('/services/:id', async (req, res, next) => {
  try {
    const result = await query(`DELETE FROM public.services WHERE id = $1 RETURNING id`, [
      req.params.id,
    ]);
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Serviço não encontrado.' });
      return;
    }
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

// Horários de trabalho
adminRouter.get('/working-hours', async (req, res, next) => {
  try {
    const estId = await resolveEstablishmentId(req.query.slug);
    if (!estId) {
      res.status(404).json({ error: 'Estabelecimento não encontrado.' });
      return;
    }
    const result = await query(
      `SELECT day_of_week, is_open, open_time::text, close_time::text, break_start::text, break_end::text
       FROM public.working_hours
       WHERE establishment_id = $1
       ORDER BY day_of_week ASC`,
      [estId]
    );
    res.json({ workingHours: result.rows });
  } catch (err) {
    next(err);
  }
});

const workingHoursArraySchema = z.object({
  workingHours: z.array(
    z.object({
      day_of_week: z.number().int().min(0).max(6),
      is_open: z.boolean(),
      open_time: z.string().regex(/^\d{2}:\d{2}/),
      close_time: z.string().regex(/^\d{2}:\d{2}/),
      break_start: z.string().regex(/^\d{2}:\d{2}/).nullable().optional(),
      break_end: z.string().regex(/^\d{2}:\d{2}/).nullable().optional(),
    })
  ),
});

adminRouter.put('/working-hours', async (req, res, next) => {
  const client = await pool.connect();
  try {
    const estId = await resolveEstablishmentId(req.query.slug);
    if (!estId) {
      res.status(404).json({ error: 'Estabelecimento não encontrado.' });
      return;
    }
    const parsed = workingHoursArraySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Formato de horários inválido.' });
      return;
    }

    await client.query('BEGIN');
    for (const wh of parsed.data.workingHours) {
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
          estId,
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

    const updated = await query(
      `SELECT day_of_week, is_open, open_time::text, close_time::text, break_start::text, break_end::text
       FROM public.working_hours WHERE establishment_id = $1 ORDER BY day_of_week ASC`,
      [estId]
    );
    res.json({ workingHours: updated.rows });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    next(err);
  } finally {
    client.release();
  }
});

// Bloqueios de agenda
adminRouter.get('/blocks', async (req, res, next) => {
  try {
    const estId = await resolveEstablishmentId(req.query.slug);
    if (!estId) {
      res.status(404).json({ error: 'Estabelecimento não encontrado.' });
      return;
    }
    const result = await query(
      `SELECT id, block_date::text, start_time::text, end_time::text, all_day, reason
       FROM public.schedule_blocks
       WHERE establishment_id = $1 AND block_date >= CURRENT_DATE - INTERVAL '7 days'
       ORDER BY block_date ASC, start_time ASC`,
      [estId]
    );
    res.json({ blocks: result.rows });
  } catch (err) {
    next(err);
  }
});

adminRouter.post('/blocks', async (req, res, next) => {
  try {
    const estId = await resolveEstablishmentId(req.query.slug);
    if (!estId) {
      res.status(404).json({ error: 'Estabelecimento não encontrado.' });
      return;
    }
    const schema = z.object({
      block_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      all_day: z.boolean().default(false),
      start_time: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
      end_time: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
      reason: z.string().trim().default(''),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Dados do bloqueio inválidos.' });
      return;
    }
    const d = parsed.data;
    const result = await query(
      `INSERT INTO public.schedule_blocks (establishment_id, block_date, all_day, start_time, end_time, reason)
       VALUES ($1, $2, $3, $4::time, $5::time, $6)
       RETURNING id, block_date::text, start_time::text, end_time::text, all_day, reason`,
      [estId, d.block_date, d.all_day, d.start_time ?? null, d.end_time ?? null, d.reason]
    );
    res.status(201).json({ block: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

adminRouter.delete('/blocks/:id', async (req, res, next) => {
  try {
    await query(`DELETE FROM public.schedule_blocks WHERE id = $1`, [req.params.id]);
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

// Agendamentos (painel do profissional)
adminRouter.get('/appointments', async (req, res, next) => {
  try {
    const estId = await resolveEstablishmentId(req.query.slug);
    if (!estId) {
      res.status(404).json({ error: 'Estabelecimento não encontrado.' });
      return;
    }
    const date = typeof req.query.date === 'string' && req.query.date ? req.query.date : null;
    const result = await query(
      `SELECT a.id, a.service_id, s.name AS service_name, s.category AS service_category,
              a.client_name, a.client_whatsapp, a.notes,
              a.appointment_date::text, a.start_time::text, a.end_time::text,
              a.price_cents, a.duration_minutes, a.status, a.created_at
       FROM public.appointments a
       JOIN public.services s ON s.id = a.service_id
       WHERE a.establishment_id = $1
         AND ($2::date IS NULL OR a.appointment_date = $2::date)
       ORDER BY a.appointment_date ASC, a.start_time ASC`,
      [estId, date]
    );
    res.json({ appointments: result.rows });
  } catch (err) {
    next(err);
  }
});

adminRouter.patch('/appointments/:id/status', async (req, res, next) => {
  try {
    const schema = z.object({
      status: z.enum(['confirmed', 'completed', 'cancelled', 'no_show']),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Status inválido.' });
      return;
    }
    const result = await query(
      `UPDATE public.appointments
       SET status = $2, updated_at = now()
       WHERE id = $1
       RETURNING id, status`,
      [req.params.id, parsed.data.status]
    );
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Agendamento não encontrado.' });
      return;
    }
    res.json({ appointment: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// Upload de imagens para Cloudflare R2
adminRouter.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Nenhum arquivo enviado.' });
      return;
    }
    if (!isR2Configured()) {
      res.status(503).json({
        error:
          'Cloudflare R2 ainda não possui R2_ACCESS_KEY_ID e R2_SECRET_ACCESS_KEY configurados no .env do genda-core.',
      });
      return;
    }
    const folder = typeof req.body?.folder === 'string' ? req.body.folder : 'uploads';
    const uploaded = await uploadImageToR2({
      buffer: req.file.buffer,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      folder,
    });
    res.status(201).json(uploaded);
  } catch (err) {
    next(err);
  }
});
