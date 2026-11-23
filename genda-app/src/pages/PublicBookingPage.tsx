import {
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Lock,
  MapPin,
  MessageCircle,
  Sparkles,
  User,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import gendaLogo from '../assets/genda-logo-horizontal-dots.svg';
import { DEFAULT_SLUG, publicApi } from '../services/api';
import type { Establishment, ServiceItem, SlotOption, WorkingHour } from '../types/genda';
import {
  DAY_NAMES_SHORT,
  formatCurrency,
  formatDuration,
  formatWhatsappInput,
  toIsoDate,
} from '../utils/format';

export function PublicBookingPage() {
  const { slug } = useParams<{ slug?: string }>();
  const activeSlug = slug || DEFAULT_SLUG;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [establishment, setEstablishment] = useState<Establishment | null>(null);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);

  // Fluxo progressivo em 3 passos na mesma tela
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<SlotOption[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const [clientName, setClientName] = useState('');
  const [clientWhatsapp, setClientWhatsapp] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<{
    id: string;
    service_name: string;
    appointment_date: string;
    start_time: string;
    price_cents: number;
    duration_minutes: number;
    client_name: string;
    establishment_name: string;
    establishment_whatsapp: string;
    establishment_address: string;
  } | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    publicApi
      .getEstablishment(activeSlug)
      .then((data) => {
        if (!active) return;
        setEstablishment(data.establishment);
        setServices(data.services);
        setWorkingHours(data.workingHours);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Erro ao carregar agenda.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [activeSlug]);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(services.map((s) => s.category)));
    return ['Todos', ...cats];
  }, [services]);

  const filteredServices = useMemo(() => {
    if (selectedCategory === 'Todos') return services;
    return services.filter((s) => s.category === selectedCategory);
  }, [services, selectedCategory]);

  // Próximos dias disponíveis conforme max_future_days e workingHours
  const availableDays = useMemo(() => {
    const maxDays = establishment?.max_future_days || 21;
    const openDaysSet = new Set(
      workingHours.filter((w) => w.is_open).map((w) => w.day_of_week)
    );
    const list: Array<{ iso: string; dayShort: string; dayNum: number; monthShort: string; isOpen: boolean }> = [];
    const today = new Date();
    for (let i = 0; i < Math.min(maxDays, 30); i++) {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
      const dow = d.getDay();
      list.push({
        iso: toIsoDate(d),
        dayShort: i === 0 ? 'Hoje' : DAY_NAMES_SHORT[dow],
        dayNum: d.getDate(),
        monthShort: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
        isOpen: openDaysSet.size === 0 ? true : openDaysSet.has(dow),
      });
    }
    return list;
  }, [establishment?.max_future_days, workingHours]);

  // Seleciona automaticamente o primeiro dia aberto ao escolher serviço
  useEffect(() => {
    if (selectedService && !selectedDate) {
      const firstOpen = availableDays.find((d) => d.isOpen);
      if (firstOpen) setSelectedDate(firstOpen.iso);
    }
  }, [selectedService, selectedDate, availableDays]);

  // Busca horários disponíveis quando serviço + data estão definidos
  useEffect(() => {
    if (!selectedService || !selectedDate) {
      setSlots([]);
      return;
    }
    let active = true;
    setLoadingSlots(true);
    setSelectedTime(null);
    publicApi
      .getSlots(activeSlug, selectedDate, selectedService.id)
      .then((res) => {
        if (!active) return;
        setSlots(res.slots);
      })
      .catch(() => {
        if (active) setSlots([]);
      })
      .finally(() => {
        if (active) setLoadingSlots(false);
      });
    return () => {
      active = false;
    };
  }, [activeSlug, selectedService, selectedDate]);

  const step2Unlocked = Boolean(selectedService);
  const step3Unlocked = Boolean(selectedService && selectedDate && selectedTime);
  const canConfirm =
    step3Unlocked &&
    clientName.trim().length >= 2 &&
    clientWhatsapp.replace(/\D/g, '').length >= 10 &&
    !submitting;

  async function handleConfirm() {
    if (!selectedService || !selectedDate || !selectedTime) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await publicApi.createAppointment(activeSlug, {
        serviceId: selectedService.id,
        date: selectedDate,
        startTime: selectedTime,
        clientName: clientName.trim(),
        clientWhatsapp: clientWhatsapp.trim(),
        notes: notes.trim() || undefined,
      });
      setConfirmed(res.appointment);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Não foi possível confirmar.');
    } finally {
      setSubmitting(false);
    }
  }

  function resetBooking() {
    setConfirmed(null);
    setSelectedService(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setClientName('');
    setClientWhatsapp('');
    setNotes('');
    setSubmitError(null);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FF] gap-3">
        <img src={gendaLogo} alt="Genda" className="h-8 animate-pulse" />
        <p className="text-sm text-[#5A6B82]">Carregando agenda...</p>
      </div>
    );
  }

  if (error || !establishment) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FF] p-6 text-center">
        <img src={gendaLogo} alt="Genda" className="h-8 mb-6" />
        <div className="genda-card max-w-md w-full p-6">
          <h1 className="text-lg font-bold text-[#1E3A8A] mb-2">Agenda indisponível</h1>
          <p className="text-sm text-[#5A6B82] mb-4">{error || 'Estabelecimento não encontrado.'}</p>
          <Link
            to="/painel"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-[#1D4ED8] text-white text-sm font-semibold"
          >
            Ir para o Painel
          </Link>
        </div>
      </div>
    );
  }

  if (confirmed) {
    const cleanPhone = confirmed.establishment_whatsapp.replace(/\D/g, '');
    const waText = encodeURIComponent(
      `Olá! Acabei de agendar *${confirmed.service_name}* para o dia *${confirmed.appointment_date.split('-').reverse().join('/')}* às *${confirmed.start_time.slice(0, 5)}*. Meu nome é ${confirmed.client_name}.`
    );
    return (
      <div className="min-h-screen bg-[#F8F9FF] py-8 px-4 flex flex-col items-center justify-center">
        <div className="max-w-md w-full genda-card p-6 sm:p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-[#10B981]/15 text-[#10B981] flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <span className="inline-block px-3 py-1 rounded-full bg-[#10B981]/10 text-[#047857] text-xs font-semibold mb-2">
            Agendamento Confirmado
          </span>
          <h1 className="text-2xl font-bold text-[#1E3A8A] mb-1">Tudo certo, {confirmed.client_name}!</h1>
          <p className="text-sm text-[#5A6B82] mb-6">
            Seu horário em <strong className="text-[#1E3A8A]">{confirmed.establishment_name}</strong> está reservado.
          </p>

          <div className="rounded-xl bg-[#F4F8FF] border border-[#DBEAFE] p-4 text-left space-y-2.5 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-[#5A6B82]">Serviço</span>
              <span className="font-semibold text-[#1E3A8A]">{confirmed.service_name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#5A6B82]">Data e horário</span>
              <span className="font-semibold text-[#1E3A8A]">
                {confirmed.appointment_date.split('-').reverse().join('/')} às {confirmed.start_time.slice(0, 5)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#5A6B82]">Duração</span>
              <span className="font-semibold text-[#1E3A8A]">{formatDuration(confirmed.duration_minutes)}</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-[#DBEAFE]">
              <span className="text-[#5A6B82]">Valor</span>
              <span className="font-bold text-[#1D4ED8]">{formatCurrency(confirmed.price_cents)}</span>
            </div>
          </div>

          <div className="space-y-3">
            {cleanPhone && (
              <a
                href={`https://wa.me/55${cleanPhone}?text=${waText}`}
                target="_blank"
                rel="noreferrer"
                className="w-full h-12 rounded-full bg-[#10B981] hover:bg-[#059669] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                Enviar comprovante no WhatsApp
              </a>
            )}
            <button
              type="button"
              onClick={resetBooking}
              className="w-full h-12 rounded-full border border-[#DBEAFE] bg-white hover:bg-[#F4F8FF] text-[#1E3A8A] font-semibold text-sm transition-colors cursor-pointer"
            >
              Fazer outro agendamento
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FF] pb-28 lg:pb-12">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#DBEAFE]">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <img src={gendaLogo} alt="Genda" className="h-6" />
          <Link
            to="/painel"
            className="text-xs font-semibold text-[#1D4ED8] hover:text-[#1E3A8A] bg-[#F4F8FF] px-3 py-1.5 rounded-full border border-[#DBEAFE] transition-colors"
          >
            Área do Profissional
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pt-5">
        {/* Banner + Perfil do Estabelecimento */}
        <section className="genda-card overflow-hidden mb-6">
          {establishment.banner_url ? (
            <div className="h-32 sm:h-44 w-full bg-[#E5EEFF]">
              <img
                src={establishment.banner_url}
                alt={establishment.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="h-24 sm:h-32 w-full bg-gradient-to-r from-[#1E3A8A] via-[#1D4ED8] to-[#3B82F6]" />
          )}

          <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="-mt-12 sm:-mt-14 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white border-2 border-[#DBEAFE] shadow-sm flex items-center justify-center overflow-hidden shrink-0">
              {establishment.logo_url ? (
                <img
                  src={establishment.logo_url}
                  alt={establishment.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Sparkles className="w-8 h-8 text-[#1D4ED8]" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-[#1E3A8A] tracking-tight">
                  {establishment.name}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#10B981]/10 text-[#047857]">
                  Agenda aberta
                </span>
              </div>
              {establishment.subtitle && (
                <p className="text-xs sm:text-sm font-medium text-[#1D4ED8] mt-0.5">
                  {establishment.subtitle}
                </p>
              )}
              {establishment.bio && (
                <p className="text-xs sm:text-sm text-[#5A6B82] mt-1">{establishment.bio}</p>
              )}
              {establishment.address && (
                <p className="inline-flex items-center gap-1.5 text-xs text-[#5A6B82] mt-2">
                  <MapPin className="w-3.5 h-3.5 text-[#1D4ED8] shrink-0" />
                  <span>
                    {establishment.address}
                    {establishment.address_complement ? ` • ${establishment.address_complement}` : ''}
                  </span>
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Indicador Progressivo de 3 Passos */}
        <div className="flex items-center gap-2 mb-6 px-1">
          <StepPill number={1} label="Serviço" active={!step2Unlocked} completed={step2Unlocked} />
          <div className="flex-1 h-0.5 bg-[#DBEAFE]" />
          <StepPill
            number={2}
            label="Dia e horário"
            active={step2Unlocked && !step3Unlocked}
            completed={step3Unlocked}
            locked={!step2Unlocked}
          />
          <div className="flex-1 h-0.5 bg-[#DBEAFE]" />
          <StepPill
            number={3}
            label="Seus dados"
            active={step3Unlocked}
            completed={false}
            locked={!step3Unlocked}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Coluna principal: os 3 passos na mesma tela */}
          <div className="lg:col-span-8 space-y-6">
            {/* PASSO 1: SERVIÇO */}
            <section className="genda-card p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-full bg-[#1D4ED8] text-white text-xs font-bold flex items-center justify-center">
                    1
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-[#1E3A8A]">
                    Selecione o serviço
                  </h2>
                </div>
                {selectedService && (
                  <span className="text-xs font-semibold text-[#10B981] flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Selecionado
                  </span>
                )}
              </div>

              {categories.length > 2 && (
                <div className="flex gap-2 overflow-x-auto pb-3 mb-3">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-[#1D4ED8] text-white'
                          : 'bg-[#F4F8FF] text-[#5A6B82] hover:text-[#1E3A8A] border border-[#DBEAFE]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}

              <div className="space-y-3">
                {filteredServices.map((service) => {
                  const isSelected = selectedService?.id === service.id;
                  return (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => setSelectedService(service)}
                      className={`w-full text-left p-4 rounded-xl transition-all flex items-center gap-4 cursor-pointer ${
                        isSelected
                          ? 'border-2 border-[#1D4ED8] bg-[#F4F8FF]'
                          : 'border border-[#DBEAFE] bg-white hover:border-[#93C5FD]'
                      }`}
                    >
                      {service.image_url && (
                        <img
                          src={service.image_url}
                          alt={service.name}
                          className="w-16 h-16 rounded-xl object-cover shrink-0 border border-[#DBEAFE]"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-[#1E3A8A] text-sm sm:text-base">
                            {service.name}
                          </h3>
                          <span className="px-2.5 py-1 rounded-full bg-[#F4F8FF] border border-[#DBEAFE] text-[#1E3A8A] text-xs font-bold shrink-0">
                            {formatCurrency(service.price_cents)}
                          </span>
                        </div>
                        {service.description && (
                          <p className="text-xs text-[#5A6B82] mt-1 line-clamp-2">
                            {service.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-[#5A6B82]">
                            <Clock className="w-3.5 h-3.5 text-[#1D4ED8]" />
                            {formatDuration(service.duration_minutes)}
                          </span>
                          <span className="text-[11px] font-medium text-[#5A6B82] px-2 py-0.5 rounded-full bg-[#F8F9FF]">
                            {service.category}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* PASSO 2: DIA E HORÁRIO (bloqueado/acinzentado até escolher serviço) */}
            <section
              className={`genda-card p-4 sm:p-6 transition-all ${
                step2Unlocked
                  ? 'opacity-100'
                  : 'opacity-50 grayscale pointer-events-none select-none bg-[#F4F8FF]'
              }`}
              aria-disabled={!step2Unlocked}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center ${
                      step2Unlocked ? 'bg-[#1D4ED8] text-white' : 'bg-[#DBEAFE] text-[#5A6B82]'
                    }`}
                  >
                    2
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-[#1E3A8A]">
                    Escolha dia e horário
                  </h2>
                </div>
                {!step2Unlocked && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-[#5A6B82]">
                    <Lock className="w-3.5 h-3.5" /> Selecione um serviço acima
                  </span>
                )}
              </div>

              {/* Carrossel horizontal de dias */}
              <div className="flex gap-2.5 overflow-x-auto pb-3 mb-4">
                {availableDays.map((d) => {
                  const isSelected = selectedDate === d.iso;
                  return (
                    <button
                      key={d.iso}
                      type="button"
                      disabled={!d.isOpen}
                      onClick={() => setSelectedDate(d.iso)}
                      className={`w-[62px] h-[78px] rounded-xl shrink-0 flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                        !d.isOpen
                          ? 'bg-[#F4F8FF] border border-dashed border-[#DBEAFE] text-[#BFDBFE] cursor-not-allowed'
                          : isSelected
                          ? 'bg-[#1D4ED8] text-white border border-[#1D4ED8] shadow-sm'
                          : 'bg-white border border-[#DBEAFE] text-[#1E3A8A] hover:border-[#1D4ED8]'
                      }`}
                    >
                      <span
                        className={`text-[11px] font-medium ${
                          isSelected ? 'text-[#DBEAFE]' : d.isOpen ? 'text-[#5A6B82]' : 'text-[#BFDBFE]'
                        }`}
                      >
                        {d.dayShort}
                      </span>
                      <span className="text-lg font-bold leading-none">{d.dayNum}</span>
                      <span
                        className={`text-[10px] uppercase ${
                          isSelected ? 'text-[#DBEAFE]' : 'text-[#5A6B82]'
                        }`}
                      >
                        {d.monthShort}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Grade de horários */}
              {step2Unlocked && (
                <div>
                  <p className="text-xs font-semibold text-[#5A6B82] mb-2.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#1D4ED8]" />
                    Horários disponíveis
                  </p>
                  {loadingSlots ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                      {Array.from({ length: 8 }).map((_, idx) => (
                        <div key={idx} className="h-11 rounded-lg bg-[#F4F8FF] animate-pulse" />
                      ))}
                    </div>
                  ) : slots.length === 0 ? (
                    <div className="p-4 rounded-xl bg-[#F4F8FF] border border-[#DBEAFE] text-center text-sm text-[#5A6B82]">
                      Nenhum horário disponível para esta data. Escolha outro dia.
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                      {slots.map((slot) => {
                        const isSelected = selectedTime === slot.time;
                        return (
                          <button
                            key={slot.time}
                            type="button"
                            disabled={!slot.available}
                            onClick={() => setSelectedTime(slot.time)}
                            className={`h-11 rounded-lg text-sm font-semibold transition-all ${
                              !slot.available
                                ? 'bg-[#F4F8FF] border border-dashed border-[#DBEAFE] text-[#BFDBFE] line-through cursor-not-allowed'
                                : isSelected
                                ? 'bg-[#1D4ED8] text-white border border-[#1D4ED8] cursor-pointer'
                                : 'bg-white border border-[#DBEAFE] text-[#1E3A8A] hover:border-[#1D4ED8] hover:text-[#1D4ED8] cursor-pointer'
                            }`}
                          >
                            {slot.time}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* PASSO 3: NOME E WHATSAPP (bloqueado/acinzentado até escolher dia e hora) */}
            <section
              className={`genda-card p-4 sm:p-6 transition-all ${
                step3Unlocked
                  ? 'opacity-100'
                  : 'opacity-50 grayscale pointer-events-none select-none bg-[#F4F8FF]'
              }`}
              aria-disabled={!step3Unlocked}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center ${
                      step3Unlocked ? 'bg-[#1D4ED8] text-white' : 'bg-[#DBEAFE] text-[#5A6B82]'
                    }`}
                  >
                    3
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-[#1E3A8A]">
                    Seus dados de contato
                  </h2>
                </div>
                {!step3Unlocked && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-[#5A6B82]">
                    <Lock className="w-3.5 h-3.5" /> Escolha dia e horário
                  </span>
                )}
              </div>

              <p className="text-xs text-[#5A6B82] mb-4">
                Rápido e sem cadastro: não precisa de senha nem e-mail.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#5A6B82] mb-1.5">
                    Seu nome completo *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#5A6B82] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Ex: Maria Oliveira"
                      className="w-full h-12 pl-10 pr-4 rounded-xl border border-[#DBEAFE] bg-[#F4F8FF] focus:bg-white focus:border-[#1D4ED8] focus:outline-none text-sm font-medium text-[#1E3A8A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5A6B82] mb-1.5">
                    WhatsApp para confirmação *
                  </label>
                  <div className="relative">
                    <MessageCircle className="w-4 h-4 text-[#10B981] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={clientWhatsapp}
                      onChange={(e) => setClientWhatsapp(formatWhatsappInput(e.target.value))}
                      placeholder="(11) 99999-9999"
                      className="w-full h-12 pl-10 pr-4 rounded-xl border border-[#DBEAFE] bg-[#F4F8FF] focus:bg-white focus:border-[#1D4ED8] focus:outline-none text-sm font-medium text-[#1E3A8A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5A6B82] mb-1.5">
                    Observação (opcional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Algum detalhe que gostaria de avisar?"
                    className="w-full h-12 px-4 rounded-xl border border-[#DBEAFE] bg-[#F4F8FF] focus:bg-white focus:border-[#1D4ED8] focus:outline-none text-sm text-[#1E3A8A]"
                  />
                </div>

                {submitError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-700">
                    {submitError}
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Resumo Desktop */}
          <aside className="hidden lg:block lg:col-span-4 sticky top-20">
            <div className="genda-card p-6 space-y-4">
              <h3 className="text-base font-bold text-[#1E3A8A]">Resumo do Agendamento</h3>

              <div className="space-y-3 text-sm">
                <div className="p-3 rounded-xl bg-[#F4F8FF] border border-[#DBEAFE]">
                  <span className="text-xs text-[#5A6B82] block">Serviço</span>
                  <span className="font-semibold text-[#1E3A8A]">
                    {selectedService ? selectedService.name : 'Selecione um serviço'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#F4F8FF] border border-[#DBEAFE]">
                  <span className="text-xs text-[#5A6B82] block">Data e Horário</span>
                  <span className="font-semibold text-[#1E3A8A]">
                    {selectedDate && selectedTime
                      ? `${selectedDate.split('-').reverse().join('/')} às ${selectedTime}`
                      : 'Aguardando seleção'}
                  </span>
                </div>

                {selectedService && (
                  <div className="flex items-center justify-between pt-2 border-t border-[#DBEAFE]">
                    <span className="text-[#5A6B82]">Total</span>
                    <span className="text-xl font-bold text-[#1D4ED8]">
                      {formatCurrency(selectedService.price_cents)}
                    </span>
                  </div>
                )}
              </div>

              <button
                type="button"
                disabled={!canConfirm}
                onClick={handleConfirm}
                className="w-full h-13 rounded-full bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:bg-[#BFDBFE] disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors cursor-pointer"
              >
                {submitting ? 'Confirmando...' : 'Confirmar Agendamento'}
              </button>
            </div>
          </aside>
        </div>
      </main>

      {/* Dock Fixo Mobile */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 genda-dock px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium text-[#5A6B82] truncate">
              {selectedService ? selectedService.name : 'Escolha um serviço'}
            </p>
            <p className="text-base font-bold text-[#1E3A8A]">
              {selectedService ? formatCurrency(selectedService.price_cents) : 'R$ 0,00'}
            </p>
          </div>
          <button
            type="button"
            disabled={!canConfirm}
            onClick={handleConfirm}
            className="h-12 px-6 rounded-full bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:bg-[#BFDBFE] text-white font-semibold text-sm shrink-0 transition-colors cursor-pointer"
          >
            {submitting ? 'Enviando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}

function StepPill({
  number,
  label,
  active,
  completed,
  locked,
}: {
  number: number;
  label: string;
  active?: boolean;
  completed?: boolean;
  locked?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <span
        className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
          completed
            ? 'bg-[#10B981] text-white'
            : active
            ? 'bg-[#1D4ED8] text-white'
            : 'bg-[#DBEAFE] text-[#5A6B82]'
        }`}
      >
        {completed ? <Check className="w-3.5 h-3.5" /> : number}
      </span>
      <span
        className={`text-xs font-semibold ${
          locked ? 'text-[#5A6B82]/60' : active || completed ? 'text-[#1E3A8A]' : 'text-[#5A6B82]'
        }`}
      >
        {label}
      </span>
    </div>
  );
}
