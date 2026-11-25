import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { isR2Configured, uploadImageToR2 } from '../config/r2';
import { timeToMinutes } from '../utils/time';
import {
  getAppointmentsByEstablishment,
  updateAppointmentStatusById,
} from '../models/appointment.model';
import {
  getEstablishmentById,
  resolveEstablishmentId,
  updateEstablishmentById,
} from '../models/establishment.model';
import {
  createScheduleBlock,
  deleteScheduleBlockById,
  getUpcomingScheduleBlocks,
} from '../models/scheduleBlock.model';
import {
  createService,
  deleteServiceById,
  getAllServicesByEstablishment,
  updateServiceById,
} from '../models/service.model';
import {
  getWorkingHoursByEstablishment,
  upsertWorkingHours,
} from '../models/workingHours.model';

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

const blockSchema = z.object({
  block_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  all_day: z.boolean().default(false),
  start_time: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  end_time: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  reason: z.string().trim().default(''),
});

const statusSchema = z.object({
  status: z.enum(['confirmed', 'completed', 'cancelled', 'no_show']),
});

export async function getAdminEstablishment(req: Request, res: Response, next: NextFunction) {
  try {
    const estId = await resolveEstablishmentId(req.query.slug);
    if (!estId) {
      res.status(404).json({ error: 'Estabelecimento não encontrado.' });
      return;
    }
    const establishment = await getEstablishmentById(estId);
    res.json({ establishment, r2Configured: isR2Configured() });
  } catch (err) {
    next(err);
  }
}

export async function updateAdminEstablishment(req: Request, res: Response, next: NextFunction) {
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
    const establishment = await updateEstablishmentById(estId, parsed.data);
    res.json({ establishment });
  } catch (err) {
    next(err);
  }
}

export async function getAdminServices(req: Request, res: Response, next: NextFunction) {
  try {
    const estId = await resolveEstablishmentId(req.query.slug);
    if (!estId) {
      res.status(404).json({ error: 'Estabelecimento não encontrado.' });
      return;
    }
    const services = await getAllServicesByEstablishment(estId);
    res.json({ services });
  } catch (err) {
    next(err);
  }
}

export async function createAdminService(req: Request, res: Response, next: NextFunction) {
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
    const service = await createService(estId, parsed.data);
    res.status(201).json({ service });
  } catch (err) {
    next(err);
  }
}

export async function updateAdminService(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = serviceSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Dados inválidos.' });
      return;
    }
    const service = await updateServiceById(String(req.params.id), parsed.data);
    if (!service) {
      res.status(404).json({ error: 'Serviço não encontrado.' });
      return;
    }
    res.json({ service });
  } catch (err) {
    next(err);
  }
}

export async function deleteAdminService(req: Request, res: Response, next: NextFunction) {
  try {
    const deleted = await deleteServiceById(String(req.params.id));
    if (!deleted) {
      res.status(404).json({ error: 'Serviço não encontrado.' });
      return;
    }
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
}

export async function getAdminWorkingHours(req: Request, res: Response, next: NextFunction) {
  try {
    const estId = await resolveEstablishmentId(req.query.slug);
    if (!estId) {
      res.status(404).json({ error: 'Estabelecimento não encontrado.' });
      return;
    }
    const workingHours = await getWorkingHoursByEstablishment(estId);
    res.json({ workingHours });
  } catch (err) {
    next(err);
  }
}

export async function updateAdminWorkingHours(req: Request, res: Response, next: NextFunction) {
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
    const normalized = parsed.data.workingHours.map((wh) => ({
      ...wh,
      break_start: wh.break_start ?? null,
      break_end: wh.break_end ?? null,
    }));

    for (const wh of normalized) {
      if (!wh.is_open) continue;
      const openMin = timeToMinutes(wh.open_time);
      const closeMin = timeToMinutes(wh.close_time);
      if (openMin >= closeMin) {
        res.status(400).json({ error: 'Horário de abertura deve ser menor que o de fechamento.' });
        return;
      }
      if ((wh.break_start && !wh.break_end) || (!wh.break_start && wh.break_end)) {
        res.status(400).json({ error: 'Informe início e fim do intervalo.' });
        return;
      }
      if (wh.break_start && wh.break_end) {
        const bStart = timeToMinutes(wh.break_start);
        const bEnd = timeToMinutes(wh.break_end);
        if (bStart >= bEnd || bStart < openMin || bEnd > closeMin) {
          res.status(400).json({
            error: 'O intervalo deve estar dentro do horário de funcionamento e com início menor que o fim.',
          });
          return;
        }
      }
    }

    const workingHours = await upsertWorkingHours(estId, normalized);
    res.json({ workingHours });
  } catch (err) {
    next(err);
  }
}

export async function getAdminBlocks(req: Request, res: Response, next: NextFunction) {
  try {
    const estId = await resolveEstablishmentId(req.query.slug);
    if (!estId) {
      res.status(404).json({ error: 'Estabelecimento não encontrado.' });
      return;
    }
    const blocks = await getUpcomingScheduleBlocks(estId);
    res.json({ blocks });
  } catch (err) {
    next(err);
  }
}

export async function createAdminBlock(req: Request, res: Response, next: NextFunction) {
  try {
    const estId = await resolveEstablishmentId(req.query.slug);
    if (!estId) {
      res.status(404).json({ error: 'Estabelecimento não encontrado.' });
      return;
    }
    const parsed = blockSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Dados do bloqueio inválidos.' });
      return;
    }
    if (!parsed.data.all_day) {
      if (!parsed.data.start_time || !parsed.data.end_time) {
        res.status(400).json({ error: 'Informe horário inicial e final para bloqueio parcial.' });
        return;
      }
      if (timeToMinutes(parsed.data.start_time) >= timeToMinutes(parsed.data.end_time)) {
        res.status(400).json({ error: 'Horário inicial do bloqueio deve ser menor que o final.' });
        return;
      }
    }
    const block = await createScheduleBlock(estId, parsed.data);
    res.status(201).json({ block });
  } catch (err) {
    next(err);
  }
}

export async function deleteAdminBlock(req: Request, res: Response, next: NextFunction) {
  try {
    await deleteScheduleBlockById(String(req.params.id));
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
}

export async function getAdminAppointments(req: Request, res: Response, next: NextFunction) {
  try {
    const estId = await resolveEstablishmentId(req.query.slug);
    if (!estId) {
      res.status(404).json({ error: 'Estabelecimento não encontrado.' });
      return;
    }
    const date = typeof req.query.date === 'string' && req.query.date ? req.query.date : null;
    const appointments = await getAppointmentsByEstablishment(estId, date);
    res.json({ appointments });
  } catch (err) {
    next(err);
  }
}

export async function updateAdminAppointmentStatus(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const parsed = statusSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Status inválido.' });
      return;
    }
    const appointment = await updateAppointmentStatusById(
      String(req.params.id),
      parsed.data.status
    );
    if (!appointment) {
      res.status(404).json({ error: 'Agendamento não encontrado.' });
      return;
    }
    res.json({ appointment });
  } catch (err) {
    next(err);
  }
}

export async function uploadAdminImage(req: Request, res: Response, next: NextFunction) {
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
    const rawFolder = typeof req.body?.folder === 'string' ? req.body.folder.trim() : '';
    const folder = rawFolder === 'estabelecimentos' ? 'estabelecimentos' : 'servicos';
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
}
