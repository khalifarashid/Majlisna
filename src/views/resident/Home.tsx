import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ArrowRight, Megaphone, Pin, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import { useI18n } from '../../i18n/I18nProvider';
import { useStore } from '../../store/StoreProvider';
import { myActiveRequest } from '../../store/reducer';
import { recommendEvents, type Pick } from '../../ai/features';
import { todayISO, formatDate, formatRelative } from '../../domain/dates';
import { REQUEST_STATUS, SLR_THEME } from '../../i18n/labels';
import { AiBadge } from '../../components/AiBadge';
import { SectionTitle, cx } from '../../components/ui';
import { EventCard } from './EventCard';
import { useAiKey } from '../../ai/useAiKey';

function greeting(lang: 'en' | 'ar') {
  const h = new Date().getHours();
  if (lang === 'ar') return h < 12 ? 'صباح الخير' : 'مساء الخير';
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

export function Home() {
  const { t, L, lang } = useI18n();
  const { state } = useStore();
  const today = todayISO();
  const req = myActiveRequest(state);
  const hasKey = useAiKey();

  const [picks, setPicks] = useState<Pick[] | null>(null);
  const [source, setSource] = useState<'claude' | 'fallback'>();
  const [loading, setLoading] = useState(false);

  const interestsKey = state.interests.join(',');
  const load = useCallback(async () => {
    setLoading(true);
    const res = await recommendEvents({
      events: state.events,
      majlises: state.majlises,
      interests: state.interests,
      rsvps: state.rsvps,
      today,
      lang,
      useAi: state.aiPrefs.enabled,
      personalise: state.aiPrefs.personalise,
    });
    setPicks(res.data);
    setSource(res.source);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interestsKey, lang, state.aiPrefs.enabled, state.aiPrefs.personalise, hasKey, state.events.length]);

  useEffect(() => {
    void load();
  }, [load]);

  const upcoming = state.events.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  const anns = [...state.announcements].sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || b.createdAt - a.createdAt).slice(0, 3);

  return (
    <div className="space-y-7 px-4 pb-6 pt-4">
      <header>
        <p className="text-sm text-gypsum-600">
          {greeting(lang)}
          {lang === 'ar' ? '،' : ','}
        </p>
        <h1 className="display text-[1.75rem] font-semibold leading-tight text-majlis-900">{lang === 'ar' ? 'حمد' : 'Hamad'}</h1>
        <p className="text-xs text-gypsum-500">{t('Khalifa City · 4 majlises near you', 'مدينة خليفة · ٤ مجالس قريبة منك')}</p>
      </header>

      {/* Plan status */}
      <Link to="/r/plan" className="group relative block overflow-hidden rounded-3xl bg-majlis-800 p-5 text-gypsum-50 shadow-lift">
        <svg className="absolute -end-6 -top-4 h-40 w-32 text-majlis-700" viewBox="0 0 100 130" aria-hidden="true">
          <path d="M5 130V50A45 45 0 0 1 95 50V130" fill="none" stroke="currentColor" strokeWidth="10" />
        </svg>
        <p className="eyebrow relative text-dallah-300">{t('Wedding plan', 'خطة العرس')}</p>
        {req ? (
          <div className="relative mt-2">
            <p className="display text-xl font-semibold">{L(state.majlises.find((m) => m.id === req.majlisId)!.name)}</p>
            <p className="mt-0.5 text-sm text-majlis-100">{formatDate(req.alternativeDate ?? req.date, lang, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            <span
              className={cx(
                'mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
                req.status === 'approved' ? 'bg-dallah-500 text-majlis-950' : req.status === 'rejected' ? 'bg-sadu-500 text-white' : 'bg-white/15 text-gypsum-50',
              )}
            >
              {req.status === 'pending' && <span className="size-1.5 animate-pulse rounded-full bg-dallah-300" />}
              {L(REQUEST_STATUS[req.status])}
            </span>
          </div>
        ) : (
          <div className="relative mt-2">
            <p className="display text-xl font-semibold leading-snug">{t('Request a majlis date', 'اطلب موعداً في المجلس')}</p>
            <p className="mt-1 max-w-[16rem] text-sm text-majlis-100">{t('Free to request. The majlis team replies in the app.', 'الطلب مجاني، ويرد فريق المجلس عبر التطبيق.')}</p>
          </div>
        )}
        <span className="relative mt-4 inline-flex items-center gap-1 text-sm font-semibold text-dallah-300">
          {req ? t('Open my plan', 'افتح خطتي') : t('Start', 'ابدأ')}
          <ArrowRight className="flip-rtl size-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </Link>

      {/* AI picks */}
      <section>
        <SectionTitle
          eyebrow={state.aiPrefs.personalise ? t('Based on your interests', 'حسب اهتماماتك') : t('Personalisation is off', 'التخصيص متوقف')}
          title={t('Picked for you', 'مختارة لك')}
          action={
            <button onClick={() => void load()} className="grid size-8 place-items-center rounded-lg text-majlis-700 hover:bg-majlis-50" aria-label={t('Refresh picks', 'تحديث')}>
              <RefreshCw className={cx('size-4', loading && 'animate-spin')} />
            </button>
          }
        />
        <AiBadge className="mt-1.5" source={source} theme={SLR_THEME.picks} loading={loading} />
        <div className="-mx-4 mt-3 flex snap-x gap-3 overflow-x-auto px-4 pb-2 no-scrollbar">
          {loading && !picks
            ? [0, 1, 2].map((i) => <div key={i} className="skeleton h-44 w-[17rem] shrink-0 rounded-2xl" />)
            : picks?.map((p, i) => {
                const ev = state.events.find((e) => e.id === p.eventId);
                if (!ev) return null;
                return (
                  <motion.div key={p.eventId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                    <EventCard event={ev} reason={p.reason} compact />
                  </motion.div>
                );
              })}
        </div>
      </section>

      {/* Announcements */}
      <section>
        <SectionTitle eyebrow={t('From your majlises', 'من مجالسك')} title={t('Announcements', 'الإعلانات')} />
        <ul className="mt-3 space-y-2.5">
          {anns.map((a) => (
            <li key={a.id} className="flex gap-3 rounded-2xl bg-white p-3.5 ring-1 ring-gypsum-200/70">
              <span className={cx('grid size-9 shrink-0 place-items-center rounded-xl', a.pinned ? 'bg-dallah-100 text-dallah-700' : 'bg-gypsum-100 text-gypsum-600')}>
                {a.pinned ? <Pin className="size-4" /> : <Megaphone className="size-4" />}
              </span>
              <div className="min-w-0">
                <p className="text-[0.8125rem] font-semibold text-majlis-950">{L(a.title)}</p>
                <p className="mt-0.5 text-[0.8125rem] leading-snug text-gypsum-600">{L(a.body)}</p>
                <p className="mt-1 text-[0.6875rem] text-gypsum-400">
                  {L(state.majlises.find((m) => m.id === a.majlisId)!.name)} · {formatRelative(a.createdAt, lang)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* All events */}
      <section>
        <SectionTitle eyebrow={t('Next few weeks', 'الأسابيع القادمة')} title={t('Community events', 'فعاليات المجتمع')} />
        <div className="mt-3 space-y-2.5">
          {upcoming.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      </section>
    </div>
  );
}
