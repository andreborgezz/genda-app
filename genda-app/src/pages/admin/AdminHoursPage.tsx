import { CalendarOff, Plus, Save, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { GendaDatePicker } from '../../components/GendaDatePicker';
import { adminApi } from '../../services/api';
import type { ScheduleBlock, WorkingHour } from '../../types/genda';
import { DAY_NAMES_FULL, toIsoDate } from '../../utils/format';

export function AdminHoursPage() {
  const [hours, setHours] = useState<WorkingHour[]>([]);
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const [blockDate, setBlockDate] = useState(() => toIsoDate(new Date()));
  const [blockAllDay, setBlockAllDay] = useState(true);
  const [blockStart, setBlockStart] = useState('12:00');
  const [blockEnd, setBlockEnd] = useState('14:00');
  const [blockReason, setBlockReason] = useState('');

  async function loadAll() {
    setLoading(true);
    try {
      const [whRes, blRes] = await Promise.all([
        adminApi.getWorkingHours(),
        adminApi.getBlocks(),
      ]);
      setHours(whRes.workingHours);
      setBlocks(blRes.blocks);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  function updateHour(dow: number, patch: Partial<WorkingHour>) {
    setHours((prev) => prev.map((h) => (h.day_of_week === dow ? { ...h, ...patch } : h)));
  }

  async function handleSaveHours() {
    setSaving(true);
    try {
      const res = await adminApi.updateWorkingHours(hours);
      setHours(res.workingHours);
      setSavedMsg('Horários atualizados!');
      setTimeout(() => setSavedMsg(null), 2500);
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateBlock(e: React.FormEvent) {
    e.preventDefault();
    await adminApi.createBlock({
      block_date: blockDate,
      all_day: blockAllDay,
      start_time: blockAllDay ? null : blockStart,
      end_time: blockAllDay ? null : blockEnd,
      reason: blockReason,
    });
    setBlockReason('');
    const blRes = await adminApi.getBlocks();
    setBlocks(blRes.blocks);
  }

  async function handleDeleteBlock(id: string) {
    await adminApi.deleteBlock(id);
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1E3A8A]">Horários e Dias de Trabalho</h1>
          <p className="text-sm text-[#5A6B82]">
            Defina sua jornada semanal, pausas e bloqueios pontuais na agenda.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSaveHours}
          disabled={saving || loading}
          className="h-11 px-5 rounded-full bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Salvando...' : 'Salvar Horários'}
        </button>
      </div>

      {savedMsg && (
        <div className="p-3 rounded-xl bg-[#10B981]/10 border border-[#10B981]/30 text-xs font-semibold text-[#047857]">
          {savedMsg}
        </div>
      )}

      {/* Dias da semana */}
      <section className="genda-card divide-y divide-[#DBEAFE]">
        {loading ? (
          <div className="p-6 text-sm text-[#5A6B82]">Carregando horários...</div>
        ) : (
          hours.map((h) => (
            <div
              key={h.day_of_week}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <label className="inline-flex items-center gap-3 min-w-[170px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={h.is_open}
                  onChange={(e) => updateHour(h.day_of_week, { is_open: e.target.checked })}
                  className="w-4 h-4 accent-[#1D4ED8]"
                />
                <span
                  className={`text-sm font-bold ${
                    h.is_open ? 'text-[#1E3A8A]' : 'text-[#5A6B82]'
                  }`}
                >
                  {DAY_NAMES_FULL[h.day_of_week]}
                </span>
              </label>

              {h.is_open ? (
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#5A6B82]">Abre</span>
                    <input
                      type="time"
                      value={h.open_time.slice(0, 5)}
                      onChange={(e) => updateHour(h.day_of_week, { open_time: e.target.value })}
                      className="h-9 px-2.5 rounded-lg border border-[#DBEAFE] bg-[#F4F8FF] font-semibold text-[#1E3A8A]"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#5A6B82]">Fecha</span>
                    <input
                      type="time"
                      value={h.close_time.slice(0, 5)}
                      onChange={(e) => updateHour(h.day_of_week, { close_time: e.target.value })}
                      className="h-9 px-2.5 rounded-lg border border-[#DBEAFE] bg-[#F4F8FF] font-semibold text-[#1E3A8A]"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#5A6B82]">Intervalo</span>
                    <input
                      type="time"
                      value={h.break_start ? h.break_start.slice(0, 5) : ''}
                      onChange={(e) =>
                        updateHour(h.day_of_week, { break_start: e.target.value || null })
                      }
                      className="h-9 px-2 rounded-lg border border-[#DBEAFE] bg-[#F4F8FF] text-[#1E3A8A]"
                    />
                    <span className="text-[#5A6B82]">às</span>
                    <input
                      type="time"
                      value={h.break_end ? h.break_end.slice(0, 5) : ''}
                      onChange={(e) =>
                        updateHour(h.day_of_week, { break_end: e.target.value || null })
                      }
                      className="h-9 px-2 rounded-lg border border-[#DBEAFE] bg-[#F4F8FF] text-[#1E3A8A]"
                    />
                  </div>
                </div>
              ) : (
                <span className="text-xs font-medium text-[#5A6B82] bg-[#F4F8FF] px-3 py-1 rounded-full self-start sm:self-auto">
                  Fechado
                </span>
              )}
            </div>
          ))
        )}
      </section>

      {/* Bloqueios Pontuais */}
      <section className="genda-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <CalendarOff className="w-5 h-5 text-[#1D4ED8]" />
          <h2 className="text-base font-bold text-[#1E3A8A]">Bloqueios Pontuais / Folgas</h2>
        </div>

        <form onSubmit={handleCreateBlock} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-xs font-semibold text-[#5A6B82] mb-1">Data</label>
            <GendaDatePicker value={blockDate} onChange={setBlockDate} placement="top" />
          </div>

          <div className="flex items-center gap-2 h-10">
            <input
              type="checkbox"
              id="all-day"
              checked={blockAllDay}
              onChange={(e) => setBlockAllDay(e.target.checked)}
              className="w-4 h-4 accent-[#1D4ED8]"
            />
            <label htmlFor="all-day" className="text-xs font-semibold text-[#1E3A8A]">
              Dia inteiro
            </label>
          </div>

          {!blockAllDay && (
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={blockStart}
                onChange={(e) => setBlockStart(e.target.value)}
                className="h-10 px-2 rounded-xl border border-[#DBEAFE] bg-[#F4F8FF] text-xs"
              />
              <input
                type="time"
                value={blockEnd}
                onChange={(e) => setBlockEnd(e.target.value)}
                className="h-10 px-2 rounded-xl border border-[#DBEAFE] bg-[#F4F8FF] text-xs"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#5A6B82] mb-1">Motivo</label>
            <input
              placeholder="Ex: Feriado / Curso"
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-[#DBEAFE] bg-[#F4F8FF] text-sm text-[#1E3A8A]"
            />
          </div>

          <button
            type="submit"
            className="h-10 px-4 rounded-full bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Bloquear
          </button>
        </form>

        {blocks.length > 0 && (
          <div className="space-y-2 pt-2">
            {blocks.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between p-3 rounded-xl bg-[#F4F8FF] border border-[#DBEAFE] text-xs"
              >
                <div>
                  <span className="font-bold text-[#1E3A8A]">
                    {b.block_date.split('-').reverse().join('/')}
                  </span>{' '}
                  <span className="text-[#5A6B82]">
                    • {b.all_day ? 'Dia inteiro' : `${b.start_time?.slice(0, 5)} às ${b.end_time?.slice(0, 5)}`}
                    {b.reason ? ` — ${b.reason}` : ''}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteBlock(b.id)}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
