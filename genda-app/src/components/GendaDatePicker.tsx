import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toIsoDate } from '../utils/format';

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

interface GendaDatePickerProps {
  value: string;
  onChange: (isoDate: string) => void;
  className?: string;
  placement?: 'bottom' | 'top';
}

export function GendaDatePicker({
  value,
  onChange,
  className = '',
  placement = 'bottom',
}: GendaDatePickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const parsedValue = useMemo(() => {
    const [y, m, d] = (value || toIsoDate(new Date())).split('-').map(Number);
    return { year: y, month: m - 1, day: d };
  }, [value]);

  const [viewYear, setViewYear] = useState(parsedValue.year);
  const [viewMonth, setViewMonth] = useState(parsedValue.month);

  useEffect(() => {
    setViewYear(parsedValue.year);
    setViewMonth(parsedValue.month);
  }, [parsedValue.year, parsedValue.month]);

  useEffect(() => {
    if (!open) return;
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  const todayIso = toIsoDate(new Date());

  const cells = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

    const list: Array<{ iso: string; day: number; inMonth: boolean }> = [];
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = new Date(viewYear, viewMonth - 1, prevMonthDays - i);
      list.push({ iso: toIsoDate(d), day: d.getDate(), inMonth: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(viewYear, viewMonth, d);
      list.push({ iso: toIsoDate(dt), day: d, inMonth: true });
    }
    const remaining = 42 - list.length;
    for (let d = 1; d <= remaining; d++) {
      const dt = new Date(viewYear, viewMonth + 1, d);
      list.push({ iso: toIsoDate(dt), day: d, inMonth: false });
    }
    return list;
  }, [viewYear, viewMonth]);

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });

  function prevMonth() {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  const formattedDisplay = value
    ? value.split('-').reverse().join('/')
    : 'Selecionar data';

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full h-10 px-3.5 rounded-xl border border-[#DBEAFE] bg-[#F4F8FF] hover:bg-white hover:border-[#1D4ED8] transition-colors flex items-center justify-between gap-2 text-sm font-semibold text-[#1E3A8A] cursor-pointer"
      >
        <span>{formattedDisplay}</span>
        <CalendarIcon className="w-4 h-4 text-[#1D4ED8] shrink-0" />
      </button>

      {open && (
        <div
          className={`absolute left-0 sm:left-auto sm:right-0 z-50 w-72 bg-white rounded-2xl border border-[#DBEAFE] p-4 ${
            placement === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
          }`}
          style={{
            boxShadow:
              '0px 10px 25px -5px rgba(30, 58, 138, 0.12), 0px 4px 10px -2px rgba(30, 58, 138, 0.05)',
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-[#1E3A8A] capitalize">{monthLabel}</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={prevMonth}
                className="w-7 h-7 rounded-full hover:bg-[#F4F8FF] text-[#1E3A8A] flex items-center justify-center cursor-pointer"
                aria-label="Mês anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={nextMonth}
                className="w-7 h-7 rounded-full hover:bg-[#F4F8FF] text-[#1E3A8A] flex items-center justify-center cursor-pointer"
                aria-label="Próximo mês"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAYS.map((w, i) => (
              <span
                key={i}
                className="text-center text-[11px] font-semibold text-[#5A6B82] py-1"
              >
                {w}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((cell) => {
              const isSelected = cell.iso === value;
              const isToday = cell.iso === todayIso;
              return (
                <button
                  key={cell.iso}
                  type="button"
                  onClick={() => {
                    onChange(cell.iso);
                    setOpen(false);
                  }}
                  className={`h-8 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center ${
                    isSelected
                      ? 'bg-[#1D4ED8] text-white'
                      : isToday
                      ? 'bg-[#F4F8FF] text-[#1D4ED8] border border-[#1D4ED8]/40'
                      : cell.inMonth
                      ? 'text-[#1E3A8A] hover:bg-[#F4F8FF]'
                      : 'text-[#5A6B82]/40 hover:bg-[#F8F9FF]'
                  }`}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-end pt-3 mt-2 border-t border-[#DBEAFE]">
            <button
              type="button"
              onClick={() => {
                onChange(todayIso);
                setOpen(false);
              }}
              className="px-3 py-1 rounded-full bg-[#F4F8FF] hover:bg-[#E5EEFF] text-xs font-semibold text-[#1D4ED8] cursor-pointer"
            >
              Hoje
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
