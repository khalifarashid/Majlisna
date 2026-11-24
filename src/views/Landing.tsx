import { Link, useNavigate } from 'react-router';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, CalendarCheck, ChartLine, Landmark, MessagesSquare, Palette, Sparkles, Star, Store, UserRound } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import { useStore } from '../store/StoreProvider';
import { LangToggle, PrototypeFooter, ROLE_PATH } from '../components/AppHeader';
import { LogoMark, Wordmark } from '../components/Logo';
import { SaduBand } from '../components/Sadu';
import type { Role } from '../domain/types';
import { cx } from '../components/ui';

const DOORS: { role: Role; icon: typeof UserRound; en: [string, string]; ar: [string, string] }[] = [
  { role: 'resident', icon: UserRound, en: ['Resident', 'Events, date requests and services'], ar: ['المواطن', 'الفعاليات وطلب الموعد والخدمات'] },
  { role: 'staff', icon: Landmark, en: ['Majlis team', 'Review and decide date requests'], ar: ['فريق المجلس', 'مراجعة طلبات المواعيد والبت فيها'] },
  { role: 'vendor', icon: Store, en: ['Vendor', 'Orders, payouts and reviews'], ar: ['المورد', 'الطلبات والمستحقات والتقييمات'] },
  { role: 'business', icon: ChartLine, en: ['Business', '8% model, forecast and break-even'], ar: ['الأعمال', 'نموذج ٨٪ والتوقعات ونقطة التعادل'] },
];

function ArchDoor({ door, index }: { door: (typeof DOORS)[number]; index: number }) {
  const { lang } = useI18n();
  const { dispatch } = useStore();
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const [title, line] = lang === 'ar' ? door.ar : door.en;
  const Icon = door.icon;
  return (
    <motion.button
      type="button"
      onClick={() => {
        dispatch({ type: 'setRole', role: door.role });
        navigate(ROLE_PATH[door.role]);
      }}
      initial={reduce ? false : { opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 + index * 0.09, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      whileHover={reduce ? undefined : { y: -8 }}
      whileTap={{ scale: 0.98 }}
      className="group relative aspect-[3/5] w-full text-start outline-none"
      aria-label={`${title}: ${line}`}
    >
      <svg viewBox="0 0 200 333" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
        <defs>
          <linearGradient id={`door-${index}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--color-majlis-700)" />
            <stop offset="1" stopColor="var(--color-majlis-950)" />
          </linearGradient>
          <radialGradient id={`glow-${index}`} cx="0.5" cy="0.28" r="0.6">
            <stop offset="0" stopColor="var(--color-dallah-300)" stopOpacity="0.55" />
            <stop offset="1" stopColor="var(--color-dallah-300)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <path d="M6 333V106A94 94 0 0 1 194 106V333Z" fill={`url(#door-${index})`} stroke="var(--color-dallah-500)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        <path d="M6 333V106A94 94 0 0 1 194 106V333Z" fill={`url(#glow-${index})`} className="opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100" />
        <path d="M20 333V110A80 80 0 0 1 180 110V333" fill="none" stroke="var(--color-dallah-500)" strokeOpacity="0.45" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      </svg>
      {/* lantern + role icon in the crown of the arch */}
      <span className="absolute inset-x-0 top-[9%] flex flex-col items-center">
        <span className="h-4 w-px bg-dallah-400/70" />
        <span className="grid size-11 place-items-center rounded-full bg-white/10 text-dallah-200 ring-1 ring-dallah-400/40 transition-all duration-500 group-hover:bg-dallah-500 group-hover:text-majlis-950 group-hover:shadow-[0_0_28px_var(--color-dallah-400)]">
          <Icon className="size-5" />
        </span>
      </span>
      <span className="absolute inset-x-[11%] bottom-[7%] flex flex-col gap-1.5 text-gypsum-50">
        <span className="display text-lg font-semibold leading-tight whitespace-nowrap xl:text-xl 2xl:text-2xl">{title}</span>
        <span className="line-clamp-3 text-xs leading-snug text-majlis-100/80 xl:text-[0.8125rem]">{line}</span>
        <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-dallah-300 opacity-60 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
          {lang === 'ar' ? 'ادخل' : 'Enter'} <ArrowRight className="flip-rtl size-3.5" />
        </span>
      </span>
    </motion.button>
  );
}

export function Landing() {
  const { t, lang } = useI18n();
  const reduce = useReducedMotion();

  return (
    <div className="min-h-dvh bg-gypsum-100">
      {/* Hero: the majlis facade */}
      <section className="relative overflow-hidden bg-majlis-900 text-gypsum-50">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 10%, var(--color-dallah-300) 0, transparent 40%), radial-gradient(circle at 85% 30%, var(--color-majlis-400) 0, transparent 45%)',
          }}
        />
        <div className="relative mx-auto max-w-[1240px] px-5 sm:px-8">
          <div className="flex h-20 items-center justify-between">
            <Wordmark light />
            <div className="flex items-center gap-2">
              <LangToggle dark />
              <Link to="/r" className="hidden h-9 items-center gap-1.5 rounded-xl bg-white/10 px-3.5 text-[0.8125rem] font-semibold ring-1 ring-white/15 transition-colors hover:bg-white/15 sm:inline-flex">
                {t('Open the app', 'افتح التطبيق')} <ArrowRight className="flip-rtl size-3.5" />
              </Link>
            </div>
          </div>

          <div className="grid gap-12 pb-0 pt-10 lg:grid-cols-[0.9fr_1.5fr] lg:items-end lg:gap-12 lg:pt-14">
            <motion.div initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} className="pb-12 lg:pb-24">
              <p className="eyebrow mb-5 text-dallah-300">{t('Prototype · Zayed University capstone', 'نموذج أولي · مشروع تخرج جامعة زايد')}</p>
              <h1 className={cx('display font-semibold text-gypsum-50', lang === 'ar' ? 'text-5xl leading-[1.25] sm:text-6xl' : 'text-5xl leading-[1.02] sm:text-[4.25rem]')}>
                {lang === 'ar' ? (
                  <>
                    كل مجالسنا
                    <br />
                    <span className="text-dallah-400">من باب واحد.</span>
                  </>
                ) : (
                  <>
                    Every majlis,
                    <br />
                    <span className="text-dallah-400">one door.</span>
                  </>
                )}
              </h1>
              <p className="mt-6 max-w-md text-[1.0625rem] leading-relaxed text-majlis-100/85">
                {t(
                  'Request a majlis date, follow the majlis team’s decision, then book trusted local services and pay in one place. In Arabic and English.',
                  'اطلب موعداً في المجلس، وتابع قرار فريق المجلس، ثم احجز خدمات موثوقة وادفع في مكان واحد، بالعربية والإنجليزية.',
                )}
              </p>
              <p className="mt-8 text-sm text-majlis-200/70">{t('Choose a door to explore the prototype →', '← اختر باباً لاستكشاف النموذج')}</p>
            </motion.div>

            {/* Facade: canopy, four doors, floor line */}
            <div className="relative">
              <div className="mb-3 h-[3px] rounded-full bg-dallah-500/80" />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                {DOORS.map((d, i) => (
                  <ArchDoor key={d.role} door={d} index={i} />
                ))}
              </div>
            </div>
          </div>
        </div>
        <SaduBand height={18} />
      </section>

      {/* How a date request works: a real sequence, so it is numbered */}
      <section className="mx-auto max-w-[1240px] px-5 py-20 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_2fr]">
          <div>
            <p className="eyebrow mb-3 text-dallah-600">{t('How it works', 'كيف يعمل')}</p>
            <h2 className="display text-3xl font-semibold leading-tight text-majlis-900">{t('From request to celebration', 'من الطلب إلى الاحتفال')}</h2>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-gypsum-600">
              {t('The government majlis team keeps every decision. Majlisna makes the steps clear.', 'يبقى القرار بيد فريق المجلس الحكومي، ومجلسنا يجعل الخطوات واضحة.')}
            </p>
          </div>
          <ol className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: CalendarCheck, en: ['Request a date', 'Pick a majlis and a free date. Requests are free.'], ar: ['اطلب موعداً', 'اختر المجلس وتاريخاً متاحاً. الطلب مجاني.'] },
              { icon: Landmark, en: ['The majlis team decides', 'They approve, decline with a reason, or suggest another date.'], ar: ['فريق المجلس يقرر', 'يعتمد الطلب أو يرفضه مع السبب أو يقترح موعداً آخر.'] },
              { icon: Store, en: ['Book trusted services', 'Coffee, Al Ayyala, photo and catering from checked vendors.'], ar: ['احجز خدمات موثوقة', 'قهوة وعيالة وتصوير وولائم من موردين موثقين.'] },
            ].map((s, i) => {
              const [title, body] = lang === 'ar' ? s.ar : s.en;
              return (
                <li key={i} className="relative rounded-2xl bg-white p-5 shadow-card ring-1 ring-gypsum-200/70">
                  <div className="mb-6 flex items-center justify-between">
                    <span className="arch grid h-12 w-10 place-items-center bg-majlis-50 text-majlis-700 [--arch-base:6px] [--arch-rise:46%]">
                      <s.icon className="size-5" />
                    </span>
                    <span className="num text-sm text-gypsum-400">0{i + 1}</span>
                  </div>
                  <p className="display text-lg font-semibold text-majlis-900">{title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-gypsum-600">{body}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* The model */}
      <section className="mx-auto max-w-[1240px] px-5 pb-20 sm:px-8">
        <div className="grid items-center gap-8 rounded-3xl bg-white p-6 shadow-card ring-1 ring-gypsum-200/70 sm:p-10 lg:grid-cols-2">
          <div>
            <p className="eyebrow mb-3 text-dallah-600">{t('Business model', 'نموذج العمل')}</p>
            <h2 className="display text-3xl font-semibold text-majlis-900">{t('Free to request. 8% on paid services.', 'الطلب مجاني. ٨٪ على الخدمات المدفوعة.')}</h2>
            <p className="mt-3 max-w-md text-[0.9375rem] leading-relaxed text-gypsum-600">
              {t(
                'Residents and vendors register for free. Majlisna earns only when a vendor completes a paid service booked through the app.',
                'التسجيل مجاني للمواطنين والموردين، ويحصل مجلسنا على عمولته فقط عند إتمام خدمة مدفوعة محجوزة عبر التطبيق.',
              )}
            </p>
          </div>
          <div>
            <div className="mb-2 flex items-baseline justify-between text-sm">
              <span className="text-gypsum-600">{t('One AED 1,000 service', 'خدمة بقيمة ١٬٠٠٠ د.إ')}</span>
            </div>
            <div className="flex h-14 overflow-hidden rounded-2xl ring-1 ring-gypsum-200">
              <div className="flex flex-[92] items-center justify-between bg-majlis-800 px-4 text-gypsum-50">
                <span className="text-sm font-semibold">{t('Vendor', 'المورد')}</span>
                <span className="num">AED 920</span>
              </div>
              <div className="flex flex-[8] items-center justify-center bg-dallah-500 text-majlis-950" title="Majlisna 8%">
                <span className="num text-xs font-semibold">8%</span>
              </div>
            </div>
            <div className="mt-2 flex justify-end text-sm text-gypsum-600">
              <span>
                {t('Majlisna keeps', 'يحتفظ مجلسنا بـ')} <span className="num font-medium text-dallah-700">AED 80</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Research basis */}
      <section className="bg-majlis-950 text-gypsum-50">
        <div className="mx-auto max-w-[1240px] px-5 py-20 sm:px-8">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <p className="eyebrow mb-3 text-dallah-300">{t('Built on our systematic review', 'مبني على مراجعتنا المنهجية')}</p>
              <h2 className="display text-3xl font-semibold leading-tight">{t('AI that supports people, not replaces them', 'ذكاء اصطناعي يدعم الناس ولا يحل محلهم')}</h2>
              <p className="mt-3 max-w-md text-[0.9375rem] leading-relaxed text-majlis-100/75">
                {t(
                  'Following PRISMA 2020, we screened 537 records from four sources down to 25 studies on AI in event management. Every AI feature here traces back to a theme from that review.',
                  'وفق منهجية PRISMA 2020 فرزنا ٥٣٧ سجلاً من أربعة مصادر وصولاً إلى ٢٥ دراسة عن الذكاء الاصطناعي في إدارة الفعاليات، وكل ميزة ذكاء اصطناعي هنا مرتبطة بمحور من تلك المراجعة.',
                )}
              </p>
              <div className="mt-8 space-y-2.5">
                {[
                  { n: 537, en: 'records identified and screened', ar: 'سجلاً تم تحديدها وفرزها' },
                  { n: 56, en: 'full-text reports assessed', ar: 'تقريراً كاملاً تم تقييمها' },
                  { n: 25, en: 'studies in the final review', ar: 'دراسة في المراجعة النهائية' },
                ].map((row) => (
                  <div key={row.n} className="flex items-center gap-3">
                    <div className="h-8 rounded-e-lg bg-dallah-500/90" style={{ width: `${Math.max(10, (row.n / 537) * 100)}%` }} />
                    <span className="num shrink-0 text-lg">{row.n}</span>
                    <span className="truncate text-sm text-majlis-100/70">{lang === 'ar' ? row.ar : row.en}</span>
                  </div>
                ))}
              </div>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {[
                { icon: Sparkles, en: ['Event picks that explain themselves', 'Theme 1–2 · machine learning & personalisation'], ar: ['ترشيحات فعاليات مع السبب', 'المحور ١–٢ · التعلم الآلي والتخصيص'] },
                { icon: MessagesSquare, en: ['Ask Majlisna, in Arabic or English', 'Theme 1 · natural language processing'], ar: ['اسأل مجلسنا بالعربية أو الإنجليزية', 'المحور ١ · معالجة اللغة الطبيعية'] },
                { icon: Palette, en: ['Decor and run-of-show ideas', 'Theme 1–2 · generative AI'], ar: ['أفكار الديكور وبرنامج الحفل', 'المحور ١–٢ · الذكاء التوليدي'] },
                { icon: Star, en: ['Review insights for vendors', 'Theme 1 · participant feedback analysis'], ar: ['تحليل التقييمات للموردين', 'المحور ١ · تحليل آراء المشاركين'] },
              ].map((f, i) => {
                const [title, theme] = lang === 'ar' ? f.ar : f.en;
                return (
                  <li key={i} className="rounded-2xl bg-white/[0.04] p-5 ring-1 ring-white/10">
                    <f.icon className="mb-4 size-5 text-dallah-300" />
                    <p className="font-semibold leading-snug">{title}</p>
                    <p className="mt-1.5 text-xs text-majlis-200/70">{theme}</p>
                  </li>
                );
              })}
              <li className="rounded-2xl bg-dallah-500 p-5 text-majlis-950 sm:col-span-2">
                <p className="font-semibold">{t('Humans decide. Privacy is a choice.', 'القرار للإنسان، والخصوصية خيار.')}</p>
                <p className="mt-1 text-sm text-majlis-950/75">
                  {t('AI never approves a date. Residents can switch personalisation off at any time (Theme 3).', 'لا يعتمد الذكاء الاصطناعي أي موعد، ويمكن للمواطن إيقاف التخصيص في أي وقت (المحور ٣).')}
                </p>
              </li>
            </ul>
          </div>
        </div>
        <SaduBand height={12} tone="gold" />
      </section>

      <div className="flex flex-col items-center gap-3 pt-12">
        <LogoMark className="h-12 w-auto opacity-80" />
        <p className="text-sm text-gypsum-600">Ahmed Almazrouei · Salem Alrumaithi</p>
      </div>
      <PrototypeFooter />
    </div>
  );
}
