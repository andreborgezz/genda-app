import { PoolClient } from 'pg';
import { pool, query } from '../config/db';
import type { ServiceRow } from '../types/genda.types';

export async function getActiveServicesByEstablishment(
  establishmentId: string
): Promise<ServiceRow[]> {
  const result = await query<ServiceRow>(
    `SELECT id, establishment_id, name, category, description, duration_minutes,
            price_cents, image_url, is_active, sort_order
     FROM public.services
     WHERE establishment_id = $1 AND is_active = true
     ORDER BY sort_order ASC, created_at ASC`,
    [establishmentId]
  );
  return result.rows;
}

export async function getAllServicesByEstablishment(
  establishmentId: string
): Promise<ServiceRow[]> {
  const result = await query<ServiceRow>(
    `SELECT * FROM public.services
     WHERE establishment_id = $1
     ORDER BY sort_order ASC, created_at ASC`,
    [establishmentId]
  );
  return result.rows;
}

export async function getActiveServiceById(
  serviceId: string,
  establishmentId: string,
  client?: PoolClient
): Promise<ServiceRow | null> {
  const runner = client || pool;
  const result = await runner.query<ServiceRow>(
    `SELECT id, establishment_id, name, category, description, duration_minutes,
            price_cents, image_url, is_active, sort_order
     FROM public.services
     WHERE id = $1 AND establishment_id = $2 AND is_active = true`,
    [serviceId, establishmentId]
  );
  return result.rows[0] ?? null;
}

export async function createService(
  establishmentId: string,
  data: {
    name: string;
    category: string;
    description: string;
    duration_minutes: number;
    price_cents: number;
    image_url?: string | null;
    is_active: boolean;
    sort_order: number;
  }
): Promise<ServiceRow> {
  const result = await query<ServiceRow>(
    `INSERT INTO public.services (
       establishment_id, name, category, description, duration_minutes,
       price_cents, image_url, is_active, sort_order
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      establishmentId,
      data.name,
      data.category,
      data.description,
      data.duration_minutes,
      data.price_cents,
      data.image_url ?? null,
      data.is_active,
      data.sort_order,
    ]
  );
  return result.rows[0];
}

export async function updateServiceById(
  id: string,
  data: Partial<{
    name: string;
    category: string;
    description: string;
    duration_minutes: number;
    price_cents: number;
    image_url: string | null;
    is_active: boolean;
    sort_order: number;
  }>
): Promise<ServiceRow | null> {
  const result = await query<ServiceRow>(
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
      id,
      data.name ?? null,
      data.category ?? null,
      data.description ?? null,
      data.duration_minutes ?? null,
      data.price_cents ?? null,
      data.image_url !== undefined,
      data.image_url ?? null,
      data.is_active ?? null,
      data.sort_order ?? null,
    ]
  );
  return result.rows[0] ?? null;
}

export async function deleteServiceById(id: string): Promise<boolean> {
  const result = await query(`DELETE FROM public.services WHERE id = $1 RETURNING id`, [id]);
  return (result.rowCount ?? 0) > 0;
}
