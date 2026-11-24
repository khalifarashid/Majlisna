import { Check, Clock, MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import { useI18n } from '../../i18n/I18nProvider';
import { useStore } from '../../store/StoreProvider';
import type { CommunityEvent } from '../../domain/types';
import { EVENT_KIND } from '../../i18n/labels';
import { fromISO } from '../../domain/dates';
import { cx } from '../../components/ui';

export function DateBlock({ iso, tone = 'light' }: { iso: string; tone?: 'light' | 'dark' }) {
  const { lang } = useI18n();
  const d = fromISO(iso);
  const month = new Intl.DateTimeFormat(lang === 'ar' ? 'ar-AE' : 'en-GB', { month: 'short', timeZone: 'UTC' }).format(d);
  const wd = new Intl.DateTimeFormat(lang === 'ar' ? 'ar-AE' : 'en-GB', { weekday: 'short', timeZone: 'UTC' }).format(d);
  return (
    <div className={cx('arch flex w-12 shrink-0 flex-col items-center pb-1.5 pt-2.5 [--arch-base:10px] [--arch-rise:40%]', tone === 'dark' ? 'bg-majlis-800 text-gypsum-50' : 'bg-majlis-50 text-majlis-800')}>
      <span className="text-[0.625rem] font-semibold uppercase opacity-70">{wd}</span>
      <span className="display text-xl font-semibold leading-none">{d.getUTCDate()}</span>
      <span className="text-[0.625rem] font-semibold uppercase opacity-70">{month}</span>
    </div>
  );
}

export function EventCard({ event, reason, compact }: { event: CommunityEvent; reason?: string; compact?: boolean }) {
  const { t, L } = useI18n();
  const { state, dispatch } = useStore();
  const going = state.rsvps.includes(event.id);
  const majlis = state.majlises.find((m) => m.id === event.majlisId);
  const left = Math.max(0, event.capacity - event.going);
  const full = left === 0 && !going;
  return (
    <article className={cx('flex gap-3 rounded-2xl bg-white p-3.5 shadow-card ring-1 ring-gypsum-200/70', compact && 'w-[17rem] shrink-0 snap-start flex-col')}>
      <div className={cx('flex gap-3', compact && 'items-start')}>
        <DateBlock iso={event.date} tone={reason ? 'dark' : 'light'} />
        <div className="min-w-0 flex-1">
          <p className="text-[0.6875rem] font-semibold text-dallah-600">{L(EVENT_KIND[event.kind])}</p>
          <h3 className="font-semibold leading-snug text-majlis-950">{L(event.title)}</h3>
          <p className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-gypsum-600">
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3" />
              {majlis && L(majlis.name)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3" />
              <span className="num">{event.time}</span>
            </span>
          </p>
          {!compact && <p className="mt-1.5 line-clamp-2 text-[0.8125rem] leading-snug text-gypsum-600">{L(event.summary)}</p>}
        </div>
      </div>
      {reason && <p className="rounded-xl bg-dallah-50 px-3 py-2 text-[0.8125rem] leading-snug text-dallah-700">{reason}</p>}
      <div className={cx('flex items-center justify-between gap-2', !compact && 'hidden')}>
        <span className="text-xs text-gypsum-500">{full ? t('Full', 'مكتمل') : t(`${left} seats left`, `${left} مقعداً متاحاً`)}</span>
        <RsvpButton going={going} disabled={full} onClick={() => dispatch({ type: 'toggleRsvp', eventId: event.id })} />
      </div>
      {!compact && (
        <div className="flex shrink-0 flex-col items-end justify-between">
          <RsvpButton going={going} disabled={full} onClick={() => dispatch({ type: 'toggleRsvp', eventId: event.id })} />
          <span className="text-[0.6875rem] text-gypsum-500">{full ? t('Full', 'مكتمل') : t(`${left} left`, `${left} متاح`)}</span>
        </div>
      )}
    </article>
  );
}

function RsvpButton({ going, disabled, onClick }: { going: boolean; disabled?: boolean; onClick: () => void }) {
  const { t } = useI18n();
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.92 }}
      disabled={disabled}
      onClick={onClick}
      aria-pressed={going}
      className={cx(
        'inline-flex h-8 items-center gap-1 rounded-full px-3 text-xs font-semibold transition-colors disabled:opacity-40',
        going ? 'bg-majlis-800 text-gypsum-50' : 'bg-majlis-50 text-majlis-800 hover:bg-majlis-100',
      )}
    >
      {going && <Check className="size-3.5" />}
      {going ? t('Going', 'سأحضر') : t('Attend', 'حضور')}
    </motion.button>
  );
}
