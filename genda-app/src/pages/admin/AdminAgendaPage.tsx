import {
  Calendar,
  CalendarDays,
  CalendarOff,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  LayoutList,
  MessageCircle,
  UserCheck,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { GendaDatePicker } from '../../components/GendaDatePicker';
import { adminApi } from '../../services/api';
import type {
  Appointment,
  AppointmentStatus,
  MonthDaySummary,
  WorkingHour,
} from '../../types/genda';
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

const WEEKDAY_HEADERS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function AdminAgendaPage() {
  const todayIso = useMemo(() => toIsoDate(new Date()), []);
  const [viewMode, setViewMode] = useState<'day' | 'month'>('day');
  const [selectedDate, setSelectedDate] = useState<string>(todayIso);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Estado do calendário mensal e resumo dos dias
  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(() => new Date().getMonth());
  const [monthDays, setMonthDays] = useState<Record<string, MonthDaySummary>>({});
  const [stripDaysMeta, setStripDaysMeta] = useState<Record<string, MonthDaySummary>>({});
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [loadingMonth, setLoadingMonth] = useState(false);

  const monthKey = useMemo(
    () => `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}`,
    [calendarYear, calendarMonth]
  );

  // Sincroniza mês do calendário quando muda selectedDate externamente
  useEffect(() => {
    const [y, m] = selectedDate.split('-').map(Number);
    if (y && m) {
      setCalendarYear(y);
      setCalendarMonth(m - 1);
    }
  }, [selectedDate]);

  const days = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 15 }).map((_, idx) => {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + idx);
      return {
        iso: toIsoDate(d),
        dayOfWeek: d.getDay(),
        dayShort: idx === 0 ? 'Hoje' : DAY_NAMES_SHORT[d.getDay()],
        dayNum: d.getDate(),
      };
    });
  }, []);

  const closedWeekdays = useMemo(() => {
    return new Set(workingHours.filter((w) => !w.is_open).map((w) => w.day_of_week));
  }, [workingHours]);

  const loadStripMeta = useCallback(async () => {
    const monthKeys = Array.from(new Set(days.map((d) => d.iso.slice(0, 7))));
    try {
      const [whRes, ...monthResponses] = await Promise.all([
        adminApi.getWorkingHours(),
        ...monthKeys.map((mk) => adminApi.getMonthSummary(mk)),
      ]);
      setWorkingHours(whRes.workingHours);
      const merged: Record<string, MonthDaySummary> = {};
      for (const res of monthResponses) {
        Object.assign(merged, res.days);
      }
      setStripDaysMeta(merged);
    } catch {
      // Silencioso para não bloquear a agenda do dia
    }
  }, [days]);

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAppointments(selectedDate);
      setAppointments(res.appointments);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  const loadMonthSummary = useCallback(async () => {
    setLoadingMonth(true);
    try {
      const res = await adminApi.getMonthSummary(monthKey);
      setMonthDays(res.days);
    } finally {
      setLoadingMonth(false);
    }
  }, [monthKey]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  useEffect(() => {
    loadStripMeta();
  }, [loadStripMeta]);

  useEffect(() => {
    if (viewMode === 'month') {
      loadMonthSummary();
    }
  }, [viewMode, loadMonthSummary]);

  async function handleStatus(id: string, status: AppointmentStatus) {
    setUpdatingId(id);
    try {
      await adminApi.updateAppointmentStatus(id, status);
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status } : a))
      );
      loadStripMeta();
      if (viewMode === 'month') {
        loadMonthSummary();
      }
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

  const monthCells = useMemo(() => {
    const firstWeekday = new Date(calendarYear, calendarMonth, 1).getDay();
    const totalDays = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const prevMonthTotal = new Date(calendarYear, calendarMonth, 0).getDate();

    const list: Array<{ iso: string; day: number; inMonth: boolean }> = [];
    for (let i = firstWeekday - 1; i >= 0; i--) {
      const d = new Date(calendarYear, calendarMonth - 1, prevMonthTotal - i);
      list.push({ iso: toIsoDate(d), day: d.getDate(), inMonth: false });
    }
    for (let d = 1; d <= totalDays; d++) {
      const dt = new Date(calendarYear, calendarMonth, d);
      list.push({ iso: toIsoDate(dt), day: d, inMonth: true });
    }
    const trailing = (7 - (list.length % 7)) % 7;
    for (let d = 1; d <= trailing; d++) {
      const dt = new Date(calendarYear, calendarMonth + 1, d);
      list.push({ iso: toIsoDate(dt), day: d, inMonth: false });
    }
    return list;
  }, [calendarYear, calendarMonth]);

  const monthLabel = useMemo(
    () =>
      new Date(calendarYear, calendarMonth, 1).toLocaleDateString('pt-BR', {
        month: 'long',
        year: 'numeric',
      }),
    [calendarYear, calendarMonth]
  );

  function goPrevMonth() {
    if (calendarMonth === 0) {
      setCalendarYear((y) => y - 1);
      setCalendarMonth(11);
    } else {
      setCalendarMonth((m) => m - 1);
    }
  }

  function goNextMonth() {
    if (calendarMonth === 11) {
      setCalendarYear((y) => y + 1);
      setCalendarMonth(0);
    } else {
      setCalendarMonth((m) => m + 1);
    }
  }

  function goToday() {
    const now = new Date();
    setCalendarYear(now.getFullYear());
    setCalendarMonth(now.getMonth());
    setSelectedDate(todayIso);
  }

  const selectedDayMeta = monthDays[selectedDate];

  return (
    <div className="space-y-6">
      {/* Cabeçalho com alternador Dia / Mês e DatePicker */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1E3A8A]">Agenda do Profissional</h1>
          <p className="text-sm text-[#5A6B82]">
            Acompanhe os atendimentos e o faturamento do dia.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="inline-flex p-1 rounded-full bg-white border border-[#DBEAFE]">
            <button
              type="button"
              onClick={() => setViewMode('day')}
              className={`h-8 px-3.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'day'
                  ? 'bg-[#1D4ED8] text-white'
                  : 'text-[#5A6B82] hover:text-[#1E3A8A]'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              Dia
            </button>
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`h-8 px-3.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'month'
                  ? 'bg-[#1D4ED8] text-white'
                  : 'text-[#5A6B82] hover:text-[#1E3A8A]'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              Mês
            </button>
          </div>

          <GendaDatePicker
            value={selectedDate}
            onChange={setSelectedDate}
            className="w-40"
          />
        </div>
      </div>

      {/* Visão Diária: carrossel rápido de 15 dias */}
      {viewMode === 'day' ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {days.map((d) => {
            const active = d.iso === selectedDate;
            const meta = stripDaysMeta[d.iso];
            const count = meta?.total_count || 0;
            const isClosed = closedWeekdays.has(d.dayOfWeek) || Boolean(meta?.block_all_day);

            return (
              <button
                key={d.iso}
                type="button"
                onClick={() => setSelectedDate(d.iso)}
                title={
                  isClosed
                    ? 'Dia fechado / sem atendimento'
                    : count > 0
                    ? `${count} agendamento(s)`
                    : undefined
                }
                className={`relative w-14 h-[70px] rounded-xl shrink-0 lg:w-auto lg:flex-1 flex flex-col items-center justify-center transition-all cursor-pointer ${
                  active
                    ? 'bg-[#1D4ED8] text-white shadow-sm'
                    : isClosed
                    ? 'bg-[#F4F8FF]/80 border border-dashed border-[#DBEAFE] text-[#5A6B82]/55 opacity-55 hover:opacity-85'
                    : 'bg-white border border-[#DBEAFE] text-[#1E3A8A] hover:border-[#1D4ED8]'
                }`}
              >
                {count > 0 && (
                  <span
                    className={`absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center leading-none ${
                      active
                        ? 'bg-white text-[#1D4ED8]'
                        : 'bg-[#1D4ED8] text-white'
                    }`}
                  >
                    {count}
                  </span>
                )}
                <span
                  className={`text-[11px] ${
                    active
                      ? 'text-[#DBEAFE]'
                      : isClosed
                      ? 'text-[#5A6B82]/60'
                      : 'text-[#5A6B82]'
                  }`}
                >
                  {d.dayShort}
                </span>
                <span className="text-base font-bold leading-tight">{d.dayNum}</span>
              </button>
            );
          })}
        </div>
      ) : (
        /* Visão Mensal Completa */
        <section className="genda-card p-4 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#1E3A8A] capitalize">{monthLabel}</h2>
              {loadingMonth && (
                <span className="text-[11px] font-medium text-[#5A6B82] animate-pulse">
                  Atualizando...
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={goToday}
                className="h-8 px-3 rounded-full bg-[#F4F8FF] hover:bg-[#E5EEFF] border border-[#DBEAFE] text-xs font-semibold text-[#1D4ED8] cursor-pointer"
              >
                Hoje
              </button>
              <button
                type="button"
                onClick={goPrevMonth}
                className="w-8 h-8 rounded-full border border-[#DBEAFE] bg-white hover:bg-[#F4F8FF] text-[#1E3A8A] flex items-center justify-center cursor-pointer"
                aria-label="Mês anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={goNextMonth}
                className="w-8 h-8 rounded-full border border-[#DBEAFE] bg-white hover:bg-[#F4F8FF] text-[#1E3A8A] flex items-center justify-center cursor-pointer"
                aria-label="Próximo mês"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Cabeçalho Domingo a Sábado */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {WEEKDAY_HEADERS.map((w) => (
              <div
                key={w}
                className="text-center text-[11px] sm:text-xs font-semibold text-[#5A6B82] py-1"
              >
                {w}
              </div>
            ))}
          </div>

          {/* Grade Mensal */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {monthCells.map((cell) => {
              const summary = cell.inMonth ? monthDays[cell.iso] : undefined;
              const isSelected = cell.iso === selectedDate;
              const isToday = cell.iso === todayIso;
              const count = summary?.total_count || 0;
              const hasBlock = Boolean(summary?.has_block);

              return (
                <button
                  key={cell.iso}
                  type="button"
                  onClick={() => {
                    setSelectedDate(cell.iso);
                    if (!cell.inMonth) {
                      const [y, m] = cell.iso.split('-').map(Number);
                      setCalendarYear(y);
                      setCalendarMonth(m - 1);
                    }
                  }}
                  className={`min-h-[54px] sm:min-h-[86px] p-1.5 sm:p-2.5 rounded-xl flex flex-col justify-between items-center sm:items-stretch text-left transition-all cursor-pointer ${
                    !cell.inMonth
                      ? 'bg-[#F8F9FF] text-[#5A6B82]/40 border border-transparent hover:border-[#DBEAFE]'
                      : isSelected
                      ? 'bg-[#1D4ED8] text-white border-2 border-[#1D4ED8] shadow-sm'
                      : isToday
                      ? 'bg-[#F4F8FF] text-[#1E3A8A] border-2 border-[#1D4ED8]/50 hover:border-[#1D4ED8]'
                      : 'bg-white text-[#1E3A8A] border border-[#DBEAFE] hover:border-[#93C5FD]'
                  }`}
                >
                  <div className="w-full flex items-center justify-center sm:justify-between gap-1">
                    <span
                      className={`text-xs sm:text-sm font-bold leading-none ${
                        isSelected
                          ? 'text-white'
                          : isToday
                          ? 'text-[#1D4ED8]'
                          : cell.inMonth
                          ? 'text-[#1E3A8A]'
                          : 'text-[#5A6B82]/40'
                      }`}
                    >
                      {cell.day}
                    </span>

                    {hasBlock && (
                      <span
                        title={summary?.block_reason || 'Dia com bloqueio'}
                        className={`hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        <CalendarOff className="w-2.5 h-2.5" />
                        Bloq.
                      </span>
                    )}
                  </div>

                  {/* Mobile: dots compactos */}
                  <div className="flex sm:hidden items-center justify-center gap-1 mt-1 h-2">
                    {count > 0 && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isSelected ? 'bg-white' : 'bg-[#1D4ED8]'
                        }`}
                      />
                    )}
                    {hasBlock && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isSelected ? 'bg-amber-200' : 'bg-amber-500'
                        }`}
                      />
                    )}
                  </div>

                  {/* Desktop: resumo diário */}
                  <div className="hidden sm:flex flex-col gap-0.5 mt-1">
                    {count > 0 && (
                      <>
                        <span
                          className={`inline-flex items-center justify-center self-start px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : 'bg-[#DBEAFE] text-[#1D4ED8]'
                          }`}
                        >
                          {count} {count === 1 ? 'atend.' : 'atends.'}
                        </span>
                        <span
                          className={`text-[10px] font-semibold truncate ${
                            isSelected ? 'text-[#DBEAFE]' : 'text-[#5A6B82]'
                          }`}
                        >
                          {formatCurrency(summary?.revenue_cents || 0)}
                        </span>
                      </>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] text-[#5A6B82]">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1D4ED8]" /> Com atendimentos
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Com bloqueio na agenda
            </span>
          </div>
        </section>
      )}

      {/* Resumo do Dia Selecionado */}
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

      {/* Linha do tempo do dia selecionado */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-bold text-[#1E3A8A]">
            Linha do Tempo — {selectedDate.split('-').reverse().join('/')}
          </h2>
          {selectedDayMeta?.has_block && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">
              <CalendarOff className="w-3.5 h-3.5" />
              {selectedDayMeta.block_all_day ? 'Bloqueio dia inteiro' : 'Bloqueio parcial'}
              {selectedDayMeta.block_reason ? ` • ${selectedDayMeta.block_reason}` : ''}
            </span>
          )}
        </div>

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
