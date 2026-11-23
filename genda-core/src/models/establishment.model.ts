import { query } from '../config/db';
import type { EstablishmentRow } from '../types/genda.types';

const DEFAULT_SLUG = 'studio-aura';

export async function getEstablishmentBySlug(slug: string): Promise<EstablishmentRow | null> {
  const result = await query<EstablishmentRow>(
    `SELECT id, slug, name, subtitle, bio, logo_url, banner_url, primary_color,
            address, address_complement, whatsapp,
            slot_interval_minutes, min_advance_minutes, max_future_days
     FROM public.establishments
     WHERE slug = $1`,
    [slug]
  );
  return result.rows[0] ?? null;
}

export async function getEstablishmentById(id: string): Promise<EstablishmentRow | null> {
  const result = await query<EstablishmentRow>(
    `SELECT id, slug, name, subtitle, bio, logo_url, banner_url, primary_color,
            address, address_complement, whatsapp,
            slot_interval_minutes, min_advance_minutes, max_future_days
     FROM public.establishments
     WHERE id = $1`,
    [id]
  );
  return result.rows[0] ?? null;
}

export async function resolveEstablishmentId(slugParam?: unknown): Promise<string | null> {
  const slug =
    typeof slugParam === 'string' && slugParam.trim() ? slugParam.trim() : DEFAULT_SLUG;
  const bySlug = await query<{ id: string }>(
    `SELECT id FROM public.establishments WHERE slug = $1`,
    [slug]
  );
  if (bySlug.rows[0]) return bySlug.rows[0].id;

  const fallback = await query<{ id: string }>(
    `SELECT id FROM public.establishments ORDER BY created_at ASC LIMIT 1`
  );
  return fallback.rows[0]?.id ?? null;
}

export async function updateEstablishmentById(
  id: string,
  data: Partial<Omit<EstablishmentRow, 'id'>>
): Promise<EstablishmentRow | null> {
  const result = await query<EstablishmentRow>(
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
      id,
      data.slug ?? null,
      data.name ?? null,
      data.subtitle ?? null,
      data.bio ?? null,
      data.logo_url !== undefined,
      data.logo_url ?? null,
      data.banner_url !== undefined,
      data.banner_url ?? null,
      data.primary_color ?? null,
      data.address ?? null,
      data.address_complement ?? null,
      data.whatsapp ?? null,
      data.slot_interval_minutes ?? null,
      data.min_advance_minutes ?? null,
      data.max_future_days ?? null,
    ]
  );
  return result.rows[0] ?? null;
}
