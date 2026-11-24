import { Link, useNavigate, useParams } from 'react-router';
import { ArrowLeft, CalendarCheck, Clock, MapPin, Users } from 'lucide-react';
import { useI18n } from '../../i18n/I18nProvider';
import { useStore } from '../../store/StoreProvider';
import { AMENITY } from '../../i18n/labels';
import { todayISO } from '../../domain/dates';
import type { ISODate, Majlis } from '../../domain/types';
import { Calendar, CalendarLegend, type DayState } from '../../components/Calendar';
import { Badge, Button, SectionTitle } from '../../components/ui';
import { EventCard } from './EventCard';

const PALETTES = [
  ['var(--color-majlis-700)', 'var(--color-dallah-400)', 'var(--color-majlis-900)'],
  ['var(--color-dallah-600)', 'var(--color-gypsum-50)', 'var(--color-dallah-700)'],
  ['var(--color-majlis-500)', 'var(--color-dallah-300)', 'var(--color-majlis-700)'],
  ['var(--color-sadu-600)', 'var(--color-dallah-200)', 'var(--color-sadu-700)'],
];

/** Illustrated facade for a sample majlis: no photos of real buildings. */
export function MajlisArt({ majlis, className = '' }: { majlis: Majlis; className?: string }) {
  const [wall, trim, door] = PALETTES[majlis.motif % PALETTES.length];
  const arches = majlis.motif === 1 ? 3 : majlis.motif === 3 ? 1 : 2;
  const w = 120;
  const gap = 10;
  const aw = (w - 30 - gap * (arches - 1)) / arches;
  return (
    <svg viewBox="0 0 120 90" className={className} aria-hidden="true" preserveAspectRatio="xMidYMax slice">
      <rect width="120" height="90" fill="var(--color-gypsum-200)" />
      <circle cx={majlis.motif % 2 ? 96 : 24} cy="20" r="9" fill="var(--color-dallah-200)" opacity="0.8" />
      <rect x="10" y="30" width="100" height="60" fill={wall} />
      <rect x="6" y="26" width="108" height="5" fill={trim} />
      {Array.from({ length: 9 }).map((_, i) => (
        <rect key={i} x={10 + i * 12} y="21" width="6" height="5" fill={trim} />
      ))}
      {Array.from({ length: arches }).map((_, i) => {
        const x = 15 + i * (aw + gap);
        const r = aw / 2;
        return <path key={i} d={`M${x} 90V${52 + (arches === 1 ? -4 : 0)}a${r} ${r} 0 0 1 ${aw} 0V90z`} fill={door} stroke={trim} strokeWidth="1.2" />;
      })}
      {majlis.motif === 2 && (
        <g fill="var(--color-majlis-800)">
          <path d="M104 90V58" stroke="var(--color-dallah-700)" strokeWidth="2" />
          <path d="M104 58c-8-2-12 2-14 6 4-3 9-4 14-6zm0 0c8-2 12 2 14 6-4-3-9-4-14-6zm0 0c-4-6-10-6-13-4 5 0 9 2 13 4zm0 0c4-6 10-6 13-4-5 0-9 2-13 4z" />
        </g>
      )}
    </svg>
  );
}

export function MajlisList() {
  const { t, L } = useI18n();
  const { state } = useStore();
  const today = todayISO();
  return (
    <div className="space-y-4 px-4 pb-6 pt-4">
      <SectionTitle eyebrow={t('Abu Dhabi · sample data', 'أبوظبي · بيانات تجريبية')} title={t('Majlises near you', 'المجالس القريبة')} />
      <ul className="space-y-3">
        {[...state.majlises]
          .sort((a, b) => a.distanceKm - b.distanceKm)
          .map((m) => {
            const nextEvent = state.events.filter((e) => e.majlisId === m.id && e.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0];
            return (
              <li key={m.id}>
                <Link to={`/r/majlises/${m.id}`} className="group flex gap-3.5 rounded-2xl bg-white p-3 shadow-card ring-1 ring-gypsum-200/70 transition-shadow hover:shadow-lift">
                  <div className="arch h-28 w-24 shrink-0 overflow-hidden [--arch-base:12px] [--arch-rise:36%]">
                    <MajlisArt majlis={m} className="h-full w-full transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <div className="min-w-0 flex-1 py-1">
                    <h3 className="display text-lg font-semibold leading-tight text-majlis-900">{L(m.name)}</h3>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-gypsum-600">
                      <MapPin className="size-3" /> {L(m.area)} · <span className="num">{m.distanceKm} km</span>
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-gypsum-600">
                      <Users className="size-3" /> {t(`Up to ${m.capacity} guests`, `حتى ${m.capacity} ضيف`)}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {m.amenities.slice(0, 3).map((a) => (
                        <Badge key={a}>{L(AMENITY[a])}</Badge>
                      ))}
                    </div>
                    {nextEvent && <p className="mt-2 truncate text-[0.6875rem] text-dallah-700">{t('Next:', 'التالي:')} {L(nextEvent.title)}</p>}
                  </div>
                </Link>
              </li>
            );
          })}
      </ul>
    </div>
  );
}

export function MajlisDetail() {
  const { id } = useParams();
  const { t, L } = useI18n();
  const { state } = useStore();
  const navigate = useNavigate();
  const today = todayISO();
  const m = state.majlises.find((x) => x.id === id);
  if (!m) return <p className="p-6 text-sm text-gypsum-600">{t('Majlis not found.', 'المجلس غير موجود.')}</p>;

  const stateOf = (d: ISODate): DayState => {
    if (d < today) return 'past';
    const reqs = state.requests.filter((r) => r.majlisId === m.id && r.date === d);
    if (reqs.some((r) => r.status === 'approved')) return reqs.some((r) => r.residentId === state.me.id && r.status === 'approved') ? 'mine' : 'booked';
    if (reqs.some((r) => r.status === 'pending')) return 'pending';
    return 'free';
  };
  const events = state.events.filter((e) => e.majlisId === m.id && e.date >= today).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="pb-6">
      <div className="relative">
        <MajlisArt majlis={m} className="h-52 w-full" />
        <button onClick={() => navigate(-1)} className="absolute start-3 top-3 grid size-9 place-items-center rounded-full bg-white/90 text-majlis-800 shadow-card backdrop-blur" aria-label={t('Back', 'رجوع')}>
          <ArrowLeft className="flip-rtl size-4" />
        </button>
      </div>
      <div className="-mt-6 space-y-5 rounded-t-3xl bg-gypsum-100 px-4 pt-5">
        <div>
          <h1 className="display text-2xl font-semibold text-majlis-900">{L(m.name)}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gypsum-600">
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" />
              {L(m.area)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="size-3.5" />
              {m.capacity}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" />
              {L(m.hours)}
            </span>
          </p>
          <p className="mt-3 text-[0.9375rem] leading-relaxed text-gypsum-700">{L(m.description)}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {m.amenities.map((a) => (
              <Badge key={a} tone="green">
                {L(AMENITY[a])}
              </Badge>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-card ring-1 ring-gypsum-200/70">
          <p className="mb-3 text-sm font-semibold text-majlis-900">{t('Availability', 'التوفر')}</p>
          <Calendar stateOf={stateOf} compact />
          <div className="mt-3">
            <CalendarLegend
              items={[
                { state: 'free', label: t('Free', 'متاح') },
                { state: 'pending', label: t('Requested', 'مطلوب') },
                { state: 'booked', label: t('Booked', 'محجوز') },
              ]}
            />
          </div>
          <Button className="mt-4" block icon={<CalendarCheck className="size-4" />} onClick={() => navigate(`/r/plan?majlis=${m.id}`)}>
            {t('Request a date here', 'اطلب موعداً هنا')}
          </Button>
        </div>

        {events.length > 0 && (
          <section>
            <p className="mb-2.5 text-sm font-semibold text-majlis-900">{t('Upcoming here', 'قريباً هنا')}</p>
            <div className="space-y-2.5">
              {events.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
