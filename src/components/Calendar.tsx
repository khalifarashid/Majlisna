import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { fromISO, monthGrid } from '../domain/dates';
import type { ISODate } from '../domain/types';
import { useI18n } from '../i18n/I18nProvider';
import { cx } from './ui';

export type DayState = 'free' | 'booked' | 'pending' | 'mine' | 'past' | 'suggested';

const WEEK_EN = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const WEEK_AR = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'];

/**
 * Month grid. The caller decides each day's state; booked and past days are not selectable.
 */
export function Calendar({
  stateOf,
  selected,
  onSelect,
  initialMonth,
  compact,
  renderBadge,
}: {
  stateOf: (d: ISODate) => DayState;
  selected?: ISODate | null;
  onSelect?: (d: ISODate) => void;
  initialMonth?: ISODate;
  compact?: boolean;
  renderBadge?: (d: ISODate) => React.ReactNode;
}) {
  const { lang, t } = useI18n();
  const start = fromISO(initialMonth ?? new Date().toISOString().slice(0, 10));
  const [ym, setYm] = useState({ y: start.getUTCFullYear(), m: start.getUTCMonth() });
  const cells = useMemo(() => monthGrid(ym.y, ym.m), [ym]);
  const title = new Intl.DateTimeFormat(lang === 'ar' ? 'ar-AE-u-nu-latn' : 'en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(Date.UTC(ym.y, ym.m, 1)),
  );
  const shift = (n: number) => setYm(({ y, m }) => ({ y: m + n < 0 ? y - 1 : m + n > 11 ? y + 1 : y, m: (m + n + 12) % 12 }));

  return (
    <div className="select-none">
      <div className="mb-2 flex items-center justify-between">
        <button type="button" onClick={() => shift(-1)} className="grid size-8 place-items-center rounded-lg text-majlis-700 hover:bg-majlis-50" aria-label={t('Previous month', 'الشهر السابق')}>
          <ChevronLeft className="flip-rtl size-4" />
        </button>
        <span className="display text-[0.95rem] font-semibold text-majlis-900">{title}</span>
        <button type="button" onClick={() => shift(1)} className="grid size-8 place-items-center rounded-lg text-majlis-700 hover:bg-majlis-50" aria-label={t('Next month', 'الشهر التالي')}>
          <ChevronRight className="flip-rtl size-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {(lang === 'ar' ? WEEK_AR : WEEK_EN).map((d, i) => (
          <span key={i} className={cx('pb-1 text-[0.6875rem] font-semibold', i >= 4 && i <= 6 ? 'text-dallah-600' : 'text-gypsum-500')}>
            {d}
          </span>
        ))}
        {cells.map((d, i) => {
          if (!d) return <span key={i} />;
          const st = stateOf(d);
          const isSel = selected === d;
          const disabled = !onSelect || st === 'booked' || st === 'past';
          return (
            <button
              key={d}
              type="button"
              disabled={disabled}
              onClick={() => onSelect?.(d)}
              aria-pressed={isSel}
              aria-label={`${d} ${st}`}
              className={cx(
                'relative grid place-items-center rounded-lg text-[0.8125rem] font-medium transition-all duration-150',
                compact ? 'h-8' : 'h-10',
                st === 'past' && 'text-gypsum-300',
                st === 'free' && 'text-majlis-900 hover:bg-majlis-50',
                st === 'booked' && 'bg-gypsum-200/70 text-gypsum-400 line-through decoration-gypsum-400/60',
                st === 'pending' && 'bg-dallah-50 text-dallah-700 ring-1 ring-inset ring-dallah-200',
                st === 'mine' && 'bg-majlis-800 text-gypsum-50',
                st === 'suggested' && 'bg-dallah-500 text-majlis-950',
                isSel && st !== 'mine' && 'bg-majlis-700 text-gypsum-50 ring-2 ring-dallah-400 ring-offset-1',
                !disabled && 'active:scale-90',
              )}
            >
              {Number(d.slice(8))}
              {renderBadge?.(d)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function CalendarLegend({ items }: { items: { state: DayState; label: string }[] }) {
  const swatch: Record<DayState, string> = {
    free: 'bg-white ring-1 ring-gypsum-300',
    booked: 'bg-gypsum-200',
    pending: 'bg-dallah-50 ring-1 ring-dallah-200',
    mine: 'bg-majlis-800',
    past: 'bg-gypsum-100',
    suggested: 'bg-dallah-500',
  };
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1">
      {items.map((it) => (
        <span key={it.state} className="inline-flex items-center gap-1.5 text-[0.6875rem] text-gypsum-600">
          <span className={cx('size-2.5 rounded-[3px]', swatch[it.state])} />
          {it.label}
        </span>
      ))}
    </div>
  );
}
