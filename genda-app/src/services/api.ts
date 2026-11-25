import type {
  Appointment,
  AppointmentStatus,
  Establishment,
  MonthDaySummary,
  ScheduleBlock,
  ServiceItem,
  SlotOption,
  WorkingHour,
} from '../types/genda';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/+$/, '');
export const DEFAULT_SLUG = import.meta.env.VITE_DEFAULT_SLUG || 'studio-aura';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...init?.headers,
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Erro na requisição (${res.status})`);
  }
  return data as T;
}

export const publicApi = {
  getEstablishment: (slug = DEFAULT_SLUG) =>
    request<{
      establishment: Establishment;
      services: ServiceItem[];
      workingHours: WorkingHour[];
    }>(`/api/public/establishments/${slug}`),

  getSlots: (slug: string, date: string, serviceId: string) =>
    request<{ date: string; slots: SlotOption[] }>(
      `/api/public/establishments/${slug}/slots?date=${encodeURIComponent(date)}&serviceId=${encodeURIComponent(serviceId)}`
    ),

  createAppointment: (
    slug: string,
    payload: {
      serviceId: string;
      date: string;
      startTime: string;
      clientName: string;
      clientWhatsapp: string;
      notes?: string;
    }
  ) =>
    request<{
      appointment: Appointment & {
        establishment_name: string;
        establishment_whatsapp: string;
        establishment_address: string;
      };
    }>(`/api/public/establishments/${slug}/appointments`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

export const adminApi = {
  getEstablishment: () =>
    request<{ establishment: Establishment; r2Configured: boolean }>('/api/admin/establishment'),

  updateEstablishment: (payload: Partial<Establishment>) =>
    request<{ establishment: Establishment }>('/api/admin/establishment', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  getServices: () => request<{ services: ServiceItem[] }>('/api/admin/services'),

  createService: (payload: Omit<ServiceItem, 'id'>) =>
    request<{ service: ServiceItem }>('/api/admin/services', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateService: (id: string, payload: Partial<ServiceItem>) =>
    request<{ service: ServiceItem }>(`/api/admin/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteService: (id: string) =>
    request<{ deleted: boolean }>(`/api/admin/services/${id}`, {
      method: 'DELETE',
    }),

  getWorkingHours: () =>
    request<{ workingHours: WorkingHour[] }>('/api/admin/working-hours'),

  updateWorkingHours: (workingHours: WorkingHour[]) =>
    request<{ workingHours: WorkingHour[] }>('/api/admin/working-hours', {
      method: 'PUT',
      body: JSON.stringify({ workingHours }),
    }),

  getBlocks: () => request<{ blocks: ScheduleBlock[] }>('/api/admin/blocks'),

  createBlock: (payload: Omit<ScheduleBlock, 'id'>) =>
    request<{ block: ScheduleBlock }>('/api/admin/blocks', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  deleteBlock: (id: string) =>
    request<{ deleted: boolean }>(`/api/admin/blocks/${id}`, {
      method: 'DELETE',
    }),

  getAppointments: (date?: string, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (date) params.set('date', date);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    const qs = params.toString();
    return request<{ appointments: Appointment[] }>(
      `/api/admin/appointments${qs ? `?${qs}` : ''}`
    );
  },

  getMonthSummary: (month: string) =>
    request<{ month: string; days: Record<string, MonthDaySummary> }>(
      `/api/admin/appointments/month-summary?month=${encodeURIComponent(month)}`
    ),

  updateAppointmentStatus: (id: string, status: AppointmentStatus) =>
    request<{ appointment: { id: string; status: AppointmentStatus } }>(
      `/api/admin/appointments/${id}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }
    ),

  uploadImage: (file: File, folder: 'estabelecimentos' | 'servicos' = 'servicos') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    return request<{ key: string; url: string }>('/api/admin/upload', {
      method: 'POST',
      body: formData,
    });
  },
};
