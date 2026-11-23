-- Genda: Seed inicial de demonstração (idempotente)

INSERT INTO public.establishments (
  slug,
  name,
  subtitle,
  bio,
  primary_color,
  address,
  address_complement,
  whatsapp,
  slot_interval_minutes,
  min_advance_minutes,
  max_future_days
)
VALUES (
  'studio-aura',
  'Studio Aura Aesthetics',
  'Estética Facial, Cílios & Cabelo',
  'Especialistas em cílios, sobrancelhas, unhas em gel e cuidados capilares com atendimento personalizado.',
  '#1D4ED8',
  'Av. Paulista, 1230 - Bela Vista, São Paulo - SP',
  'Conjunto 42, 4º andar',
  '(11) 99999-8888',
  30,
  60,
  30
)
ON CONFLICT (slug) DO NOTHING;

DO $$
DECLARE
  v_est_id uuid;
BEGIN
  SELECT id INTO v_est_id FROM public.establishments WHERE slug = 'studio-aura';

  -- Serviços iniciais (apenas se ainda não houver serviços)
  IF NOT EXISTS (SELECT 1 FROM public.services WHERE establishment_id = v_est_id) THEN
    INSERT INTO public.services (establishment_id, name, category, description, duration_minutes, price_cents, sort_order)
    VALUES
      (v_est_id, 'Design de Sobrancelhas + Lash Lifting', 'Cílios & Sobrancelhas', 'Mapeamento facial, design estratégico e curvatura natural dos cílios com hidratação.', 60, 16000, 1),
      (v_est_id, 'Corte & Finalização Studio', 'Cabelo', 'Consultoria de visagismo, lavagem relaxante, corte personalizado e escova modelada.', 60, 14000, 2),
      (v_est_id, 'Manicure Completa + Esmaltação em Gel', 'Unhas', 'Cuticulagem russa/tradicional, nivelamento e esmaltação em gel de alta durabilidade.', 75, 11000, 3),
      (v_est_id, 'Limpeza de Pele Profunda + LED', 'Estética Facial', 'Higienização, extração ultrassônica, máscara calmante e fototerapia com LED.', 90, 22000, 4),
      (v_est_id, 'Extensão Volume Russo', 'Cílios & Sobrancelhas', 'Fios tecnológicos ultraleves para um olhar marcante e acabamento impecável.', 120, 24000, 5);
  END IF;

  -- Horários padrão (Seg-Sáb abertos, Dom fechado)
  INSERT INTO public.working_hours (establishment_id, day_of_week, is_open, open_time, close_time, break_start, break_end)
  VALUES
    (v_est_id, 0, false, '09:00', '18:00', NULL, NULL),
    (v_est_id, 1, true,  '09:00', '19:00', '12:00', '13:00'),
    (v_est_id, 2, true,  '09:00', '19:00', '12:00', '13:00'),
    (v_est_id, 3, true,  '09:00', '19:00', '12:00', '13:00'),
    (v_est_id, 4, true,  '09:00', '19:00', '12:00', '13:00'),
    (v_est_id, 5, true,  '09:00', '20:00', '12:00', '13:00'),
    (v_est_id, 6, true,  '09:00', '17:00', NULL, NULL)
  ON CONFLICT (establishment_id, day_of_week) DO NOTHING;

  -- Agendamentos de demonstração para hoje (se ainda não houver nenhum)
  IF NOT EXISTS (SELECT 1 FROM public.appointments WHERE establishment_id = v_est_id) THEN
    INSERT INTO public.appointments (
      establishment_id, service_id, client_name, client_whatsapp,
      appointment_date, start_time, end_time, price_cents, duration_minutes, status
    )
    SELECT
      v_est_id,
      s.id,
      'Mariana Costa',
      '11988776655',
      CURRENT_DATE,
      '10:00'::time,
      '11:00'::time,
      s.price_cents,
      s.duration_minutes,
      'confirmed'
    FROM public.services s
    WHERE s.establishment_id = v_est_id
    ORDER BY s.sort_order ASC
    LIMIT 1;

    INSERT INTO public.appointments (
      establishment_id, service_id, client_name, client_whatsapp,
      appointment_date, start_time, end_time, price_cents, duration_minutes, status
    )
    SELECT
      v_est_id,
      s.id,
      'Camila Ferreira',
      '11977665544',
      CURRENT_DATE,
      '14:30'::time,
      '15:45'::time,
      s.price_cents,
      s.duration_minutes,
      'confirmed'
    FROM public.services s
    WHERE s.establishment_id = v_est_id
    ORDER BY s.sort_order ASC
    OFFSET 2 LIMIT 1;
  END IF;
END $$;
