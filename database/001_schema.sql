-- Genda: Schema inicial para Supabase (PostgreSQL)
-- Executar na ordem: 001_schema.sql -> 002_seed.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Estabelecimentos / Profissionais
CREATE TABLE IF NOT EXISTS public.establishments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  subtitle text DEFAULT 'Estética & Beleza',
  bio text DEFAULT '',
  logo_url text,
  banner_url text,
  primary_color text NOT NULL DEFAULT '#1D4ED8',
  address text DEFAULT '',
  address_complement text DEFAULT '',
  whatsapp text DEFAULT '',
  slot_interval_minutes integer NOT NULL DEFAULT 30 CHECK (slot_interval_minutes > 0),
  min_advance_minutes integer NOT NULL DEFAULT 60 CHECK (min_advance_minutes >= 0),
  max_future_days integer NOT NULL DEFAULT 30 CHECK (max_future_days > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Serviços oferecidos
CREATE TABLE IF NOT EXISTS public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id uuid NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'Geral',
  description text DEFAULT '',
  duration_minutes integer NOT NULL CHECK (duration_minutes > 0),
  price_cents integer NOT NULL CHECK (price_cents >= 0),
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_services_establishment_active
  ON public.services (establishment_id, is_active, sort_order);

-- 3. Horários e dias de trabalho (0 = Domingo .. 6 = Sábado)
CREATE TABLE IF NOT EXISTS public.working_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id uuid NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  is_open boolean NOT NULL DEFAULT true,
  open_time time NOT NULL DEFAULT '09:00',
  close_time time NOT NULL DEFAULT '19:00',
  break_start time,
  break_end time,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (establishment_id, day_of_week)
);

-- 4. Bloqueios pontuais de agenda (feriados, folgas, compromissos)
CREATE TABLE IF NOT EXISTS public.schedule_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id uuid NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  block_date date NOT NULL,
  start_time time,
  end_time time,
  all_day boolean NOT NULL DEFAULT false,
  reason text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_schedule_blocks_est_date
  ON public.schedule_blocks (establishment_id, block_date);

-- 5. Agendamentos (público: nome + WhatsApp, sem login/senha/e-mail obrigatório)
CREATE TABLE IF NOT EXISTS public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id uuid NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
  client_name text NOT NULL,
  client_whatsapp text NOT NULL,
  notes text DEFAULT '',
  appointment_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  price_cents integer NOT NULL CHECK (price_cents >= 0),
  duration_minutes integer NOT NULL CHECK (duration_minutes > 0),
  status text NOT NULL DEFAULT 'confirmed'
    CHECK (status IN ('confirmed', 'completed', 'cancelled', 'no_show')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appointments_est_date_status
  ON public.appointments (establishment_id, appointment_date, status);

CREATE INDEX IF NOT EXISTS idx_appointments_service_id
  ON public.appointments (service_id);
