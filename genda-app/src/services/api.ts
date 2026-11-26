import type {
  Appointment,
  AppointmentStatus,
  AuthUser,
  Establishment,
  MonthDaySummary,
  ScheduleBlock,
  ServiceItem,
  SlotOption,
  WorkingHour,
} from '../types/genda';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/+$/, '');
export const DEFAULT_SLUG = import.meta.env.VITE_DEFAULT_SLUG || 'studio-aura';

const TOKEN_KEY = 'genda_token';
const USER_KEY = 'genda_user';

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setAuthSession(token: string, user: AuthUser, rememberMe: boolean) {
  clearAuthSession();
  const storage = rememberMe ? localStorage : sessionStorage;
  storage.setItem(TOKEN_KEY, token);
  storage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuthSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}

async function request<T>(path: string, init?: RequestInit, withAuth = false): Promise<T> {
  const token = withAuth ? getAuthToken() : null;
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && withAuth) {
    clearAuthSession();
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }
  if (!res.ok) {
    throw new Error(data.error || `Erro na requisição (${res.status})`);
  }
  return data as T;
}

export const authApi = {
  login: (payload: { email: string; password: string; rememberMe: boolean }) =>
    request<{ token: string; user: AuthUser; establishment: Establishment }>(
      '/api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),

  me: () =>
    request<{ user: AuthUser; establishment: Establishment }>(
      '/api/auth/me',
      undefined,
      true
    ),

  requestPasswordReset: (email: string) =>
    request<{ message: string }>('/api/auth/request-password-reset', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  confirmPasswordReset: (token: string, password: string) =>
    request<{ message: string }>('/api/auth/confirm-password-reset', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    }),
};

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
    request<{ establishment: Establishment; r2Configured: boolean }>(
      '/api/admin/establishment',
      undefined,
      true
    ),

  updateEstablishment: (payload: Partial<Establishment>) =>
    request<{ establishment: Establishment }>(
      '/api/admin/establishment',
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      },
      true
    ),

  getServices: () =>
    request<{ services: ServiceItem[] }>('/api/admin/services', undefined, true),

  createService: (payload: Omit<ServiceItem, 'id'>) =>
    request<{ service: ServiceItem }>(
      '/api/admin/services',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      true
    ),

  updateService: (id: string, payload: Partial<ServiceItem>) =>
    request<{ service: ServiceItem }>(
      `/api/admin/services/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      },
      true
    ),

  deleteService: (id: string) =>
    request<{ deleted: boolean }>(
      `/api/admin/services/${id}`,
      {
        method: 'DELETE',
      },
      true
    ),

  getWorkingHours: () =>
    request<{ workingHours: WorkingHour[] }>('/api/admin/working-hours', undefined, true),

  updateWorkingHours: (workingHours: WorkingHour[]) =>
    request<{ workingHours: WorkingHour[] }>(
      '/api/admin/working-hours',
      {
        method: 'PUT',
        body: JSON.stringify({ workingHours }),
      },
      true
    ),

  getBlocks: () =>
    request<{ blocks: ScheduleBlock[] }>('/api/admin/blocks', undefined, true),

  createBlock: (payload: Omit<ScheduleBlock, 'id'>) =>
    request<{ block: ScheduleBlock }>(
      '/api/admin/blocks',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      true
    ),

  deleteBlock: (id: string) =>
    request<{ deleted: boolean }>(
      `/api/admin/blocks/${id}`,
      {
        method: 'DELETE',
      },
      true
    ),

  getAppointments: (date?: string, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (date) params.set('date', date);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    const qs = params.toString();
    return request<{ appointments: Appointment[] }>(
      `/api/admin/appointments${qs ? `?${qs}` : ''}`,
      undefined,
      true
    );
  },

  getMonthSummary: (month: string) =>
    request<{ month: string; days: Record<string, MonthDaySummary> }>(
      `/api/admin/appointments/month-summary?month=${encodeURIComponent(month)}`,
      undefined,
      true
    ),

  updateAppointmentStatus: (id: string, status: AppointmentStatus) =>
    request<{ appointment: { id: string; status: AppointmentStatus } }>(
      `/api/admin/appointments/${id}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      },
      true
    ),

  uploadImage: (file: File, folder: 'estabelecimentos' | 'servicos' = 'servicos') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    return request<{ key: string; url: string }>(
      '/api/admin/upload',
      {
        method: 'POST',
        body: formData,
      },
      true
    );
  },
};
