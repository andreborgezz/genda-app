export interface Establishment {
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
}

export interface ServiceItem {
  id: string;
  name: string;
  category: string;
  description: string;
  duration_minutes: number;
  price_cents: number;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface WorkingHour {
  day_of_week: number;
  is_open: boolean;
  open_time: string;
  close_time: string;
  break_start: string | null;
  break_end: string | null;
}

export interface ScheduleBlock {
  id: string;
  block_date: string;
  start_time: string | null;
  end_time: string | null;
  all_day: boolean;
  reason: string;
}

export interface SlotOption {
  time: string;
  available: boolean;
}

export type AppointmentStatus = 'confirmed' | 'completed' | 'cancelled' | 'no_show';

export interface Appointment {
  id: string;
  service_id: string;
  service_name: string;
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

export interface MonthDaySummary {
  total_count: number;
  confirmed_count: number;
  completed_count: number;
  revenue_cents: number;
  has_block: boolean;
  block_all_day: boolean;
  block_reason: string;
}

export interface AuthUser {
  id: string;
  establishment_id: string;
  name: string;
  email: string;
  plan_name: string;
  plan_status: string;
}
