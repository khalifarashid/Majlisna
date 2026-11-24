import { useEffect, useRef } from 'react';
import { NavLink, Route, Routes, useLocation } from 'react-router';
import { CalendarCheck, House, Landmark, MessagesSquare, UserRound, MonitorSmartphone } from 'lucide-react';
import { useI18n } from '../../i18n/I18nProvider';
import { useStore } from '../../store/StoreProvider';
import { myActiveRequest } from '../../store/reducer';
import { REQUEST_STATUS } from '../../i18n/labels';
import { formatRelative } from '../../domain/dates';
import { cx } from '../../components/ui';
import { Home } from './Home';
import { MajlisList, MajlisDetail } from './Majlises';
import { Plan } from './Plan';
import { Assistant } from './Assistant';
import { Profile } from './Profile';

const TABS = [
  { to: '/r', end: true, icon: House, en: 'Home', ar: 'الرئيسية' },
  { to: '/r/majlises', icon: Landmark, en: 'Majlises', ar: 'المجالس' },
  { to: '/r/plan', icon: CalendarCheck, en: 'My plan', ar: 'خطتي' },
  { to: '/r/ask', icon: MessagesSquare, en: 'Ask', ar: 'اسأل' },
  { to: '/r/profile', icon: UserRound, en: 'Profile', ar: 'حسابي' },
];

function TabBar() {
  const { t } = useI18n();
  const { state } = useStore();
  const req = myActiveRequest(state);
  const planDot = req?.status === 'alternative' || (req?.status === 'approved' && !state.orders.some((o) => o.requestId === req.id));
  return (
    <nav className="grid grid-cols-5 border-t border-gypsum-200 bg-white/95 px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur" aria-label={t('Resident navigation', 'تنقل المواطن')}>
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) => cx('relative flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[0.6875rem] font-semibold transition-colors', isActive ? 'text-majlis-800' : 'text-gypsum-500 hover:text-majlis-700')}
        >
          {({ isActive }) => (
            <>
              <span className={cx('grid h-7 w-12 place-items-center rounded-full transition-colors', isActive && 'bg-majlis-50')}>
                <tab.icon className="size-[19px]" strokeWidth={isActive ? 2.2 : 1.8} />
              </span>
              {t(tab.en, tab.ar)}
              {tab.to === '/r/plan' && planDot && <span className="absolute end-[22%] top-1 size-2 rounded-full bg-sadu-500 ring-2 ring-white" />}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

function Screens() {
  return (
    <Routes>
      <Route index element={<Home />} />
      <Route path="majlises" element={<MajlisList />} />
      <Route path="majlises/:id" element={<MajlisDetail />} />
      <Route path="plan" element={<Plan />} />
      <Route path="ask" element={<Assistant />} />
      <Route path="profile" element={<Profile />} />
    </Routes>
  );
}

function SidePanelLeft() {
  const { t } = useI18n();
  return (
    <aside className="hidden w-72 shrink-0 flex-col gap-4 pt-8 xl:flex">
      <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-gypsum-200/70">
        <MonitorSmartphone className="mb-3 size-5 text-dallah-600" />
        <p className="display text-lg font-semibold text-majlis-900">{t('You are Hamad', 'أنت حمد')}</p>
        <p className="mt-1 text-sm leading-relaxed text-gypsum-600">
          {t('A resident of Khalifa City planning his wedding. Request a majlis date, then book services once it’s approved.', 'مواطن من مدينة خليفة يخطط لعرسه. اطلب موعداً في المجلس، ثم احجز الخدمات بعد الاعتماد.')}
        </p>
      </div>
      <div className="rounded-2xl border border-dashed border-dallah-300 bg-dallah-50/60 p-5">
        <p className="eyebrow mb-2 text-dallah-700">{t('Demo tip', 'نصيحة للعرض')}</p>
        <p className="text-sm leading-relaxed text-gypsum-700">
          {t('Open the Majlis team view in a second tab. Send a request here and watch it arrive there live. Approve it and this phone updates instantly.', 'افتح واجهة فريق المجلس في تبويب ثانٍ. أرسل طلباً من هنا وشاهده يصل هناك مباشرة، ثم اعتمده وسيتحدث هذا الهاتف فوراً.')}
        </p>
        <a href="#/staff" target="_blank" rel="noreferrer" className="mt-3 inline-flex text-sm font-semibold text-majlis-700 underline underline-offset-4">
          {t('Open Majlis team view ↗', 'افتح واجهة فريق المجلس ↗')}
        </a>
      </div>
    </aside>
  );
}

function SidePanelRight() {
  const { t, L, lang } = useI18n();
  const { state } = useStore();
  const req = myActiveRequest(state);
  const feed = state.notifications.filter((n) => n.to === 'resident').slice(0, 5);
  return (
    <aside className="hidden w-72 shrink-0 flex-col gap-4 pt-8 xl:flex">
      <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-gypsum-200/70">
        <p className="eyebrow mb-2 text-dallah-600">{t('Your request', 'طلبك')}</p>
        {req ? (
          <>
            <p className="font-semibold text-majlis-900">{L(state.majlises.find((m) => m.id === req.majlisId)!.name)}</p>
            <p className="num mt-0.5 text-sm text-gypsum-600">{req.date}</p>
            <p className={cx('mt-2 text-sm font-semibold', req.status === 'approved' ? 'text-majlis-600' : req.status === 'rejected' ? 'text-sadu-600' : 'text-dallah-700')}>{L(REQUEST_STATUS[req.status])}</p>
          </>
        ) : (
          <p className="text-sm text-gypsum-600">{t('No request yet.', 'لا يوجد طلب بعد.')}</p>
        )}
      </div>
      <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-gypsum-200/70">
        <p className="eyebrow mb-3 text-dallah-600">{t('Live activity', 'آخر النشاط')}</p>
        <ul className="space-y-3">
          {feed.map((n) => (
            <li key={n.id} className="text-[0.8125rem] leading-snug text-gypsum-700">
              {L(n.text)}
              <span className="block text-[0.6875rem] text-gypsum-400">{formatRelative(n.at, lang)}</span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

/** Phone frame on desktop, full-bleed app on phones. */
export function ResidentApp() {
  const { pathname } = useLocation();
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="mx-auto flex max-w-[1400px] justify-center gap-10 px-0 sm:px-6 lg:pb-6">
      <SidePanelLeft />
      <div className="w-full sm:pt-6 lg:w-auto">
        {/* Device */}
        <div className="relative mx-auto flex w-full flex-col overflow-hidden bg-gypsum-100 sm:h-[min(860px,calc(100dvh-7.5rem))] sm:max-w-[420px] sm:rounded-[2.75rem] sm:shadow-device sm:ring-[10px] sm:ring-majlis-950">
          <div className="pointer-events-none absolute left-1/2 top-2 z-30 hidden h-6 w-28 -translate-x-1/2 rounded-full bg-majlis-950 sm:block" />
          <div ref={scroller} className="flex-1 overflow-y-auto scroll-thin pb-24 sm:pt-6">
            <Screens />
          </div>
          <div className="fixed inset-x-0 bottom-0 z-30 sm:absolute">
            <TabBar />
          </div>
        </div>
      </div>
      <SidePanelRight />
    </div>
  );
}
