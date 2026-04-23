'use client';

import { useState, useEffect, useCallback } from 'react';

interface TimePickerProps {
  /**
   * Cal.com calLink in "username/event-slug" format (e.g. "okami/okami-review").
   * Used for availability lookup via /api/availability.
   */
  calLink: string;
  /** Called when a slot is picked. Advances the /book flow to the intake step. */
  onSlotSelect: (iso: string) => void;
  /** Highlights the matching slot with a selected (burgundy) state. */
  selectedSlot?: string | null;
}

/* ── Date helpers (no external deps) ───────────────────────────── */

function getMondayOfWeek(weekOffset: number): Date {
  const today = new Date();
  const dow = today.getDay(); // 0 = Sun
  const daysSinceMon = dow === 0 ? 6 : dow - 1;
  const mon = new Date(today);
  mon.setDate(today.getDate() - daysSinceMon + weekOffset * 7);
  mon.setHours(0, 0, 0, 0);
  return mon;
}

function toYMD(date: Date): string {
  // Returns YYYY-MM-DD in local time
  return date.toLocaleDateString('en-CA');
}

function isToday(date: Date): boolean {
  return toYMD(date) === toYMD(new Date());
}

function isPast(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

/** If all weekdays (Mon–Fri) of the current week are past, start on next week. */
function getInitialWeekOffset(): number {
  const friday = getMondayOfWeek(0);
  friday.setDate(friday.getDate() + 4); // Friday of current week
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today > friday ? 1 : 0;
}

function formatWeekRange(monday: Date): string {
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  const m = monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const f = friday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${m} – ${f}`;
}

function formatDayHeader(date: Date): { weekday: string; day: string } {
  return {
    weekday: date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
    day: String(date.getDate()),
  };
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatSelectedDayLabel(ymd: string): string {
  // Parse YYYY-MM-DD as local date to avoid UTC offset issues
  const [y, m, d] = ymd.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

/* ── Component ──────────────────────────────────────────────────── */

export default function TimePicker({ calLink, onSlotSelect, selectedSlot }: TimePickerProps) {
  const [weekOffset, setWeekOffset] = useState(getInitialWeekOffset);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [slots, setSlots] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const monday = getMondayOfWeek(weekOffset);
  const weekDays = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });

  const fetchSlots = useCallback(async () => {
    setLoading(true);
    setApiError(null);

    const start = new Date(monday);
    const end = new Date(monday);
    end.setDate(end.getDate() + 7);

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    try {
      const res = await fetch(
        `/api/availability?calLink=${encodeURIComponent(calLink)}` +
          `&start=${encodeURIComponent(start.toISOString())}` +
          `&end=${encodeURIComponent(end.toISOString())}` +
          `&timeZone=${encodeURIComponent(tz)}`
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setApiError(data.error || 'Unable to load availability.');
        setSlots({});
        return;
      }

      const data = await res.json();

      // Normalize: slots values may be objects { start: "..." }, { time: "..." }, or bare strings
      const normalized: Record<string, string[]> = {};
      for (const [date, arr] of Object.entries(data.slots ?? {})) {
        normalized[date] = (arr as Array<string | { start?: string; time?: string }>).map((s) =>
          typeof s === 'string' ? s : (s.start ?? s.time ?? '')
        ).filter(Boolean);
      }

      setSlots(normalized);

      // Auto-select first available future day
      setSelectedDay((prev) => {
        if (prev && normalized[prev]?.length) return prev; // keep if still valid
        const first = weekDays.find((d) => !isPast(d) && (normalized[toYMD(d)]?.length ?? 0) > 0);
        return first ? toYMD(first) : null;
      });
    } catch {
      setApiError('Network error. Check your connection and try again.');
      setSlots({});
    } finally {
      setLoading(false);
    }
    // weekDays is intentionally omitted — it's derived from weekOffset which IS in deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calLink, weekOffset]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  function handleSlotClick(isoTime: string) {
    onSlotSelect(isoTime);
  }

  const activeSlots = selectedDay ? (slots[selectedDay] ?? []) : [];
  const canGoPrev = weekOffset > 0;
  const directUrl = `https://cal.com/${calLink}`;

  return (
    <div className="w-full">
      {/* Week navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => {
            setWeekOffset((n) => n - 1);
            setSelectedDay(null);
          }}
          disabled={!canGoPrev}
          className="font-mono text-[10px] tracking-widest uppercase text-ash hover:text-off-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
        >
          ← Prev
        </button>
        <span className="font-mono text-[10px] tracking-widest uppercase text-ash">
          {formatWeekRange(monday)}
        </span>
        <button
          onClick={() => {
            setWeekOffset((n) => n + 1);
            setSelectedDay(null);
          }}
          className="font-mono text-[10px] tracking-widest uppercase text-ash hover:text-off-white transition-colors"
        >
          Next →
        </button>
      </div>

      {/* Day pills */}
      <div className="flex gap-2 mb-8 overflow-x-auto">
        {weekDays.map((day) => {
          const ymd = toYMD(day);
          const past = isPast(day);
          const hasSlots = !loading && (slots[ymd]?.length ?? 0) > 0;
          const active = selectedDay === ymd;
          const { weekday, day: dayNum } = formatDayHeader(day);

          return (
            <button
              key={ymd}
              onClick={() => hasSlots && !past && setSelectedDay(ymd)}
              disabled={past || loading || !hasSlots}
              className={[
                'flex-none flex flex-col items-center px-5 py-3 border transition-colors',
                active
                  ? 'border-burgundy bg-burgundy/10 text-off-white'
                  : hasSlots && !past
                  ? 'border-ash/30 text-ash hover:border-ash/60 hover:text-off-white cursor-pointer'
                  : 'border-ash/10 text-ash/25 cursor-not-allowed',
              ].join(' ')}
            >
              <span className="font-mono text-[9px] tracking-widest">{weekday}</span>
              <span
                className={[
                  'font-mono text-sm mt-0.5',
                  isToday(day) ? 'underline underline-offset-2' : '',
                ].join(' ')}
              >
                {dayNum}
              </span>
              {/* availability dot */}
              <span
                className={[
                  'w-1 h-1 rounded-full mt-1.5 transition-colors',
                  loading ? 'bg-ash/20' : hasSlots ? 'bg-burgundy/60' : 'bg-transparent',
                ].join(' ')}
              />
            </button>
          );
        })}
      </div>

      {/* Slot area */}
      <div className="min-h-32">
        {loading ? (
          <div className="flex items-center gap-2 h-32">
            <span className="font-mono text-[10px] tracking-widest uppercase text-ash/40 animate-pulse">
              Loading availability...
            </span>
          </div>
        ) : apiError ? (
          /* API not configured or error */
          <div className="py-8 space-y-4">
            <p className="font-body text-xs text-ash/60">{apiError}</p>
            <a
              href={directUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-off-white underline underline-offset-4 hover:text-off-white/70 transition-colors"
            >
              Book directly on Cal.com →
            </a>
          </div>
        ) : !selectedDay ? (
          <div className="flex items-center h-32">
            <span className="font-mono text-[10px] text-ash/40 tracking-widest uppercase">
              No availability this week.
            </span>
          </div>
        ) : activeSlots.length === 0 ? (
          <div className="flex items-center h-32">
            <span className="font-mono text-[10px] text-ash/40 tracking-widest uppercase">
              No availability on this day.
            </span>
          </div>
        ) : (
          <div>
            <p className="font-mono text-[10px] tracking-widest uppercase text-ash/50 mb-4">
              {formatSelectedDayLabel(selectedDay)}
            </p>

            {/* Time grid: 2 cols mobile, 4 cols desktop */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {activeSlots.map((slot) => {
                const isSelected = selectedSlot === slot;
                return (
                  <button
                    key={slot}
                    onClick={() => handleSlotClick(slot)}
                    className={`font-mono text-xs py-2.5 px-3 border transition-colors text-center ${
                      isSelected
                        ? 'border-burgundy bg-burgundy/10 text-off-white'
                        : 'border-ash/20 text-ash hover:border-burgundy hover:text-off-white hover:bg-burgundy/10'
                    }`}
                  >
                    {formatTime(slot)}
                  </button>
                );
              })}
            </div>

            <p className="font-mono text-[10px] text-ash/35 mt-4">
              Times shown in your local timezone.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
