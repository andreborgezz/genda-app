export type AppointmentStatus = 'confirmed' | 'completed' | 'cancelled' | 'no_show';

export interface EstablishmentRow {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  bio: string;
  logo_url: string | null;
  banner_url: string | null;
  primary_color: string;
  address: string;
  address_complement: string;
  whatsapp: string;
  slot_interval_minutes: number;
  min_advance_minutes: number;
  max_future_days: number;
  created_at?: string;
  updated_at?: string;
}

export interface ServiceRow {
  id: string;
  establishment_id: string;
  name: string;
  category: string;
  description: string;
  duration_minutes: number;
  price_cents: number;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface WorkingHourRow {
  day_of_week: number;
  is_open: boolean;
  open_time: string;
  close_time: string;
  break_start: string | null;
  break_end: string | null;
}

export interface ScheduleBlockRow {
  id: string;
  block_date: string;
  start_time: string | null;
  end_time: string | null;
  all_day: boolean;
  reason: string;
}

export interface AppointmentRow {
  id: string;
  service_id: string;
  service_name?: string;
  service_category?: string;
  client_name: string;
  client_whatsapp: string;
  notes: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  price_cents: number;
  duration_minutes: number;
  status: AppointmentStatus;
  created_at: string;
}

export interface SlotOption {
  time: string;
  available: boolean;
}
