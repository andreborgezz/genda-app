import {
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  MessageCircle,
  UserCheck,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminApi } from '../../services/api';
import type { Appointment, AppointmentStatus } from '../../types/genda';
import { DAY_NAMES_SHORT, formatCurrency, formatDuration, toIsoDate } from '../../utils/format';

const STATUS_META: Record<
  AppointmentStatus,
  { label: string; badgeClass: string }
> = {
  confirmed: { label: 'Confirmado', badgeClass: 'bg-[#DBEAFE] text-[#1E3A8A]' },
  completed: { label: 'Concluído', badgeClass: 'bg-[#10B981]/15 text-[#047857]' },
  cancelled: { label: 'Cancelado', badgeClass: 'bg-red-100 text-red-700' },
  no_show: { label: 'Não compareceu', badgeClass: 'bg-amber-100 text-amber-800' },
};

export function AdminAgendaPage() {
  const [selectedDate, setSelectedDate] = useState<string>(() => toIsoDate(new Date()));
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const days = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 14 }).map((_, idx) => {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + idx);
      return {
        iso: toIsoDate(d),
        dayShort: idx === 0 ? 'Hoje' : DAY_NAMES_SHORT[d.getDay()],
        dayNum: d.getDate(),
      };
    });
  }, []);

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAppointments(selectedDate);
      setAppointments(res.appointments);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  async function handleStatus(id: string, status: AppointmentStatus) {
    setUpdatingId(id);
    try {
      await adminApi.updateAppointmentStatus(id, status);
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status } : a))
      );
    } finally {
      setUpdatingId(null);
    }
  }

  const stats = useMemo(() => {
    const active = appointments.filter((a) => a.status !== 'cancelled');
    const completed = appointments.filter((a) => a.status === 'completed');
    const revenue = active.reduce((sum, a) => sum + a.price_cents, 0);
    return {
      total: active.length,
      completed: completed.length,
      revenue,
    };
  }, [appointments]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1E3A8A]">Agenda do Profissional</h1>
          <p className="text-sm text-[#5A6B82]">
            Acompanhe os atendimentos e o faturamento do dia.
          </p>
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="h-10 px-3.5 rounded-xl border border-[#DBEAFE] bg-white text-sm font-semibold text-[#1E3A8A]"
        />
      </div>

      {/* Carrossel rápido de dias */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {days.map((d) => {
          const active = d.iso === selectedDate;
          return (
            <button
              key={d.iso}
              type="button"
              onClick={() => setSelectedDate(d.iso)}
              className={`w-14 h-16 rounded-xl shrink-0 flex flex-col items-center justify-center transition-colors cursor-pointer ${
                active
                  ? 'bg-[#1D4ED8] text-white'
                  : 'bg-white border border-[#DBEAFE] text-[#1E3A8A] hover:border-[#1D4ED8]'
              }`}
            >
              <span className={`text-[11px] ${active ? 'text-[#DBEAFE]' : 'text-[#5A6B82]'}`}>
                {d.dayShort}
              </span>
              <span className="text-base font-bold">{d.dayNum}</span>
            </button>
          );
        })}
      </div>

      {/* Resumo do Dia */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="genda-card p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#5A6B82] mb-1">
            <Calendar className="w-4 h-4 text-[#1D4ED8]" />
            Atendimentos
          </div>
          <p className="text-xl sm:text-2xl font-bold text-[#1E3A8A]">{stats.total}</p>
        </div>
        <div className="genda-card p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#5A6B82] mb-1">
            <UserCheck className="w-4 h-4 text-[#10B981]" />
            Concluídos
          </div>
          <p className="text-xl sm:text-2xl font-bold text-[#1E3A8A]">{stats.completed}</p>
        </div>
        <div className="genda-card p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#5A6B82] mb-1">
            <DollarSign className="w-4 h-4 text-[#1D4ED8]" />
            Previsto
          </div>
          <p className="text-lg sm:text-2xl font-bold text-[#1D4ED8] truncate">
            {formatCurrency(stats.revenue)}
          </p>
        </div>
      </div>

      {/* Linha do tempo */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-[#1E3A8A]">Linha do Tempo de Atendimentos</h2>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-24 rounded-2xl bg-white border border-[#DBEAFE] animate-pulse" />
            ))}
          </div>
        ) : appointments.length === 0 ? (
          <div className="genda-card p-8 text-center">
            <p className="text-sm font-semibold text-[#1E3A8A] mb-1">
              Nenhum agendamento para esta data
            </p>
            <p className="text-xs text-[#5A6B82]">
              Compartilhe seu link público para receber novos clientes.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.map((appt) => {
              const meta = STATUS_META[appt.status];
              const cleanWa = appt.client_whatsapp.replace(/\D/g, '');
              return (
                <div
                  key={appt.id}
                  className="genda-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="px-3 py-2 rounded-xl bg-[#F4F8FF] border border-[#DBEAFE] text-center shrink-0">
                      <span className="block text-sm font-bold text-[#1D4ED8]">
                        {appt.start_time.slice(0, 5)}
                      </span>
                      <span className="block text-[11px] text-[#5A6B82]">
                        {appt.end_time.slice(0, 5)}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-[#1E3A8A] text-base">{appt.client_name}</h3>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${meta.badgeClass}`}
                        >
                          {meta.label}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-[#1D4ED8] mt-0.5">
                        {appt.service_name}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-[#5A6B82]">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDuration(appt.duration_minutes)}
                        </span>
                        <span className="font-semibold text-[#1E3A8A]">
                          {formatCurrency(appt.price_cents)}
                        </span>
                        <span>{appt.client_whatsapp}</span>
                      </div>
                      {appt.notes && (
                        <p className="text-xs text-[#5A6B82] mt-1 italic">Obs: {appt.notes}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {cleanWa && (
                      <a
                        href={`https://wa.me/55${cleanWa}`}
                        target="_blank"
                        rel="noreferrer"
                        className="h-9 px-3 rounded-full bg-[#10B981]/10 text-[#047857] hover:bg-[#10B981]/20 text-xs font-semibold inline-flex items-center gap-1.5"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        WhatsApp
                      </a>
                    )}

                    {appt.status === 'confirmed' && (
                      <>
                        <button
                          type="button"
                          disabled={updatingId === appt.id}
                          onClick={() => handleStatus(appt.id, 'completed')}
                          className="h-9 px-3 rounded-full bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Concluir
                        </button>
                        <button
                          type="button"
                          disabled={updatingId === appt.id}
                          onClick={() => handleStatus(appt.id, 'cancelled')}
                          className="h-9 px-3 rounded-full border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Cancelar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
