import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { CalendarCheck, Check, Clock, Minus, Palette, Plus, Send, Sparkles, TriangleExclamationPoint, X } from 'lucide-react';
import { useI18n } from '../../i18n/I18nProvider';
import { useStore } from '../../store/StoreProvider';
import { myActiveRequest } from '../../store/reducer';
import { OCCASION, REQUEST_STATUS } from '../../i18n/labels';
import { addDays, formatDate, formatRelative, todayISO } from '../../domain/dates';
import type { DateRequest, ISODate, Occasion } from '../../domain/types';
import { Calendar, CalendarLegend, type DayState } from '../../components/Calendar';
import { SaduBand } from '../../components/Sadu';
import { Badge, Button, Card, Field, Segmented, Textarea, cx } from '../../components/ui';
import { useToast } from '../../components/Toasts';
import { MajlisArt } from './Majlises';
import { VendorMarket, MyBookings } from './VendorMarket';
import { IdeasSheet } from './IdeasSheet';

export function Plan() {
  const { t } = useI18n();
  const { state } = useStore();
  const req = myActiveRequest(state);
  const [fresh, setFresh] = useState(false);
  const [ideasOpen, setIdeasOpen] = useState(false);

  const showForm = !req || fresh || req.status === 'rejected';

  return (
    <div className="space-y-5 px-4 pb-6 pt-4">
      <AnimatePresence mode="wait" initial={false}>
        {showForm ? (
          <motion.div key="form" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
            {req?.status === 'rejected' && !fresh && <RejectedBanner req={req} />}
            <RequestForm onSent={() => setFresh(false)} />
          </motion.div>
        ) : (
          <motion.div key="status" className="space-y-5" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
            <StatusCard req={req!} />
            {req!.status === 'approved' && (
              <>
                <MyBookings requestId={req!.id} />
                <VendorMarket requestId={req!.id} />
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIdeasOpen(true)}
        className="group flex w-full items-center gap-3 rounded-2xl bg-gradient-to-br from-dallah-100 to-dallah-50 p-4 text-start ring-1 ring-dallah-200 transition-shadow hover:shadow-card"
      >
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-dallah-500 text-majlis-950">
          <Palette className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-majlis-900">{t('Decor & evening ideas', 'أفكار الديكور وبرنامج الأمسية')}</span>
          <span className="block text-[0.8125rem] text-gypsum-600">{t('A palette, setup and run-of-show for your majlis', 'ألوان وتجهيزات وبرنامج للحفل في مجلسك')}</span>
        </span>
        <Sparkles className="size-4 text-dallah-600 transition-transform group-hover:rotate-12" />
      </button>
      <IdeasSheet open={ideasOpen} onClose={() => setIdeasOpen(false)} request={req && req.status !== 'rejected' ? req : undefined} />
    </div>
  );
}

function RejectedBanner({ req }: { req: DateRequest }) {
  const { t, L } = useI18n();
  const { state } = useStore();
  return (
    <div className="mb-5 flex gap-3 rounded-2xl bg-sadu-50 p-4 ring-1 ring-sadu-100">
      <TriangleExclamationPoint className="mt-0.5 size-5 shrink-0 text-sadu-600" />
      <div className="text-sm">
        <p className="font-semibold text-sadu-700">
          {L(state.majlises.find((m) => m.id === req.majlisId)!.name)} · {req.date}: {L(REQUEST_STATUS.rejected)}
        </p>
        <p className="mt-0.5 text-gypsum-700">{req.reason}</p>
        <p className="mt-1.5 text-gypsum-600">{t('You can request another date below.', 'يمكنك طلب موعد آخر أدناه.')}</p>
      </div>
    </div>
  );
}

function RequestForm({ onSent }: { onSent: () => void }) {
  const { t, L, lang } = useI18n();
  const { state, dispatch } = useStore();
  const toast = useToast();
  const [params] = useSearchParams();
  const today = todayISO();
  const [majlisId, setMajlisId] = useState(params.get('majlis') ?? state.majlises[0].id);
  const [date, setDate] = useState<ISODate | null>(null);
  const [guests, setGuests] = useState(200);
  const [occasion, setOccasion] = useState<Occasion>('wedding');
  const [note, setNote] = useState('');
  const majlis = state.majlises.find((m) => m.id === majlisId)!;

  const stateOf = (d: ISODate): DayState => {
    if (d <= today) return 'past';
    const reqs = state.requests.filter((r) => r.majlisId === majlisId && r.date === d);
    if (reqs.some((r) => r.status === 'approved')) return 'booked';
    if (reqs.some((r) => r.status === 'pending')) return 'pending';
    return 'free';
  };
  const othersPending = date ? state.requests.filter((r) => r.majlisId === majlisId && r.date === date && r.status === 'pending').length : 0;
  const overCapacity = guests > majlis.capacity;

  const submit = () => {
    if (!date) return;
    const ok = dispatch({ type: 'submitRequest', majlisId, date, guests, occasion, note, at: Date.now() });
    if (ok) {
      toast(t(`Request sent to the ${majlis.name.en} team.`, `تم إرسال الطلب إلى فريق ${majlis.name.ar}.`));
      onSent();
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="eyebrow text-dallah-600">{t('Step 1 of 3 · free', 'الخطوة ١ من ٣ · مجاناً')}</p>
        <h1 className="display mt-1 text-[1.6rem] font-semibold leading-tight text-majlis-900">{t('Request a majlis date', 'اطلب موعداً في المجلس')}</h1>
        <p className="mt-1 text-sm text-gypsum-600">{t('The government majlis team reviews every request and replies here.', 'يراجع فريق المجلس الحكومي كل طلب ويرد عليك هنا.')}</p>
      </div>

      <div>
        <p className="mb-2 text-[0.8125rem] font-semibold text-gypsum-700">{t('Majlis', 'المجلس')}</p>
        <div className="-mx-4 flex snap-x gap-2.5 overflow-x-auto px-4 pb-1 no-scrollbar">
          {state.majlises.map((m) => {
            const on = m.id === majlisId;
            return (
              <button
                key={m.id}
                onClick={() => {
                  setMajlisId(m.id);
                  setDate(null);
                }}
                aria-pressed={on}
                className={cx('w-32 shrink-0 snap-start rounded-2xl bg-white p-2 text-start ring-2 transition-all', on ? 'ring-majlis-700' : 'ring-transparent shadow-card hover:ring-gypsum-300')}
              >
                <div className="arch h-20 overflow-hidden [--arch-base:10px] [--arch-rise:40%]">
                  <MajlisArt majlis={m} className="h-full w-full" />
                </div>
                <p className="mt-2 truncate text-[0.8125rem] font-semibold text-majlis-900">{L(m.name)}</p>
                <p className="truncate text-[0.6875rem] text-gypsum-500">
                  {L(m.area)} · {m.capacity}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <Card className="p-4">
        <p className="mb-3 text-[0.8125rem] font-semibold text-gypsum-700">{t('Date', 'التاريخ')}</p>
        <Calendar stateOf={stateOf} selected={date} onSelect={setDate} initialMonth={addDays(today, 7)} />
        <div className="mt-3">
          <CalendarLegend
            items={[
              { state: 'free', label: t('Free', 'متاح') },
              { state: 'pending', label: t('Others requested', 'مطلوب من آخرين') },
              { state: 'booked', label: t('Booked', 'محجوز') },
            ]}
          />
        </div>
        <AnimatePresence>
          {othersPending > 0 && (
            <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-3 rounded-xl bg-dallah-50 px-3 py-2 text-xs leading-snug text-dallah-700">
              {t(
                `${othersPending} other family has also requested this date. The majlis team will choose; you may be offered another date.`,
                `هناك ${othersPending} طلب آخر لهذا التاريخ. سيقرر فريق المجلس، وقد يُقترح عليك موعد بديل.`,
              )}
            </motion.p>
          )}
        </AnimatePresence>
      </Card>

      <div className="grid grid-cols-1 gap-4">
        <Field label={t('Occasion', 'المناسبة')}>
          <Segmented
            value={occasion}
            onChange={setOccasion}
            options={(['wedding', 'engagement', 'celebration'] as Occasion[]).map((o) => ({ value: o, label: L(OCCASION[o]) }))}
            size="sm"
          />
        </Field>
        <Field label={t('Expected guests', 'عدد الضيوف المتوقع')} hint={overCapacity ? t(`This majlis holds up to ${majlis.capacity}.`, `يتسع هذا المجلس لـ${majlis.capacity} كحد أقصى.`) : undefined}>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setGuests((g) => Math.max(20, g - 10))} className="grid size-10 place-items-center rounded-xl bg-white ring-1 ring-gypsum-300 active:scale-95" aria-label={t('Fewer guests', 'أقل')}>
              <Minus className="size-4" />
            </button>
            <span className={cx('num min-w-14 text-center text-xl', overCapacity && 'text-sadu-600')}>{guests}</span>
            <button type="button" onClick={() => setGuests((g) => Math.min(600, g + 10))} className="grid size-10 place-items-center rounded-xl bg-white ring-1 ring-gypsum-300 active:scale-95" aria-label={t('More guests', 'أكثر')}>
              <Plus className="size-4" />
            </button>
          </div>
        </Field>
        <Field label={t('Note for the majlis team (optional)', 'ملاحظة لفريق المجلس (اختياري)')}>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('e.g. family hall needed from 8 pm', 'مثال: نحتاج القاعة العائلية من الساعة ٨ مساءً')} maxLength={280} />
        </Field>
      </div>

      <div className="sticky bottom-24 z-10 rounded-2xl bg-majlis-900 p-3 text-gypsum-50 shadow-lift">
        <div className="mb-2.5 flex items-center justify-between px-1 text-sm">
          <span className="truncate text-majlis-100">
            {L(majlis.name)} · {date ? formatDate(date, lang) : t('pick a date', 'اختر تاريخاً')}
          </span>
          <span className="shrink-0 font-semibold text-dallah-300">{t('Free', 'مجاني')}</span>
        </div>
        <Button variant="gold" block size="lg" disabled={!date || overCapacity} onClick={submit} icon={<Send className="flip-rtl size-4" />}>
          {t('Send request', 'أرسل الطلب')}
        </Button>
      </div>
    </div>
  );
}

const STEPS = [
  { en: 'Requested', ar: 'تم الطلب' },
  { en: 'Majlis decision', ar: 'قرار المجلس' },
  { en: 'Services booked', ar: 'حجز الخدمات' },
];

function StatusCard({ req }: { req: DateRequest }) {
  const { t, L, lang } = useI18n();
  const { state, dispatch } = useStore();
  const toast = useToast();
  const majlis = state.majlises.find((m) => m.id === req.majlisId)!;
  const hasOrders = state.orders.some((o) => o.requestId === req.id);
  const done = req.status === 'approved' ? (hasOrders ? 3 : 2) : 1;
  const lastNote = [...req.history].reverse().find((h) => h.by === 'staff' && h.note)?.note;

  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-gypsum-200/70">
      <div className="relative bg-majlis-800 px-5 pb-5 pt-4 text-gypsum-50">
        <div className="flex items-center justify-between">
          <p className="eyebrow text-dallah-300">{L(OCCASION[req.occasion])}</p>
          <span className="num text-[0.6875rem] text-majlis-200">#{req.id.slice(-5).toUpperCase()}</span>
        </div>
        <h1 className="display mt-2 text-2xl font-semibold">{L(majlis.name)}</h1>
        <p className="mt-0.5 text-sm text-majlis-100">
          {formatDate(req.date, lang, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · {t(`${req.guests} guests`, `${req.guests} ضيف`)}
        </p>
      </div>

      {/* Woven progress: each completed step is woven in */}
      <div className="px-5 pt-4">
        <div className="grid grid-cols-3 gap-1.5">
          {STEPS.map((s, i) => (
            <div key={i}>
              <div className="overflow-hidden rounded-[3px]">
                {i < done ? (
                  <motion.div initial={{ clipPath: 'inset(0 100% 0 0)' }} animate={{ clipPath: 'inset(0 0% 0 0)' }} transition={{ duration: 0.8, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}>
                    <SaduBand height={12} />
                  </motion.div>
                ) : i === done && req.status === 'pending' ? (
                  <div className="relative">
                    <SaduBand height={12} tone="muted" />
                    <div className="absolute inset-0 animate-pulse bg-dallah-200/40" />
                  </div>
                ) : (
                  <SaduBand height={12} tone="muted" />
                )}
              </div>
              <p className={cx('mt-1.5 text-[0.6875rem] font-semibold', i < done ? 'text-majlis-800' : 'text-gypsum-400')}>{t(s.en, s.ar)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3 p-5">
        {req.status === 'pending' && (
          <>
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-dallah-50 text-dallah-700">
                <Clock className="size-4" />
              </span>
              <div>
                <p className="font-semibold text-majlis-900">{L(REQUEST_STATUS.pending)}</p>
                <p className="text-[0.8125rem] leading-snug text-gypsum-600">
                  {t('Sent', 'أُرسل')} {formatRelative(req.createdAt, lang)}. {t('Teams usually reply within two days.', 'يرد الفريق عادة خلال يومين.')}
                </p>
              </div>
            </div>
            <a href="#/staff" target="_blank" rel="noreferrer" className="block rounded-xl border border-dashed border-dallah-300 px-3 py-2 text-xs text-dallah-700">
              {t('Demo: open the Majlis team view in a new tab to decide on this request ↗', 'للعرض: افتح واجهة فريق المجلس في تبويب جديد للبت في هذا الطلب ↗')}
            </a>
            <Button variant="danger" size="sm" icon={<X className="size-3.5" />} onClick={() => dispatch({ type: 'cancelRequest', id: req.id, at: Date.now() }) && toast(t('Request cancelled.', 'تم إلغاء الطلب.'), 'info')}>
              {t('Cancel request', 'إلغاء الطلب')}
            </Button>
          </>
        )}

        {req.status === 'alternative' && req.alternativeDate && (
          <div className="rounded-2xl bg-dallah-50 p-4 ring-1 ring-dallah-200">
            <p className="text-sm font-semibold text-dallah-700">{t('The majlis team suggested another date', 'اقترح فريق المجلس موعداً آخر')}</p>
            <p className="display mt-1 text-xl font-semibold text-majlis-900">{formatDate(req.alternativeDate, lang, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            {lastNote && <p className="mt-1 text-[0.8125rem] text-gypsum-700">“{lastNote}”</p>}
            <div className="mt-3 flex gap-2">
              <Button
                variant="primary"
                className="flex-1"
                icon={<Check className="size-4" />}
                onClick={() => dispatch({ type: 'respondAlternative', id: req.id, accept: true, at: Date.now() }) && toast(t('Date accepted. You can book services now.', 'تم قبول الموعد. يمكنك حجز الخدمات الآن.'))}
              >
                {t('Accept date', 'قبول الموعد')}
              </Button>
              <Button variant="ghost" onClick={() => dispatch({ type: 'respondAlternative', id: req.id, accept: false, at: Date.now() })}>
                {t('Decline', 'رفض')}
              </Button>
            </div>
          </div>
        )}

        {req.status === 'approved' && (
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-majlis-800 text-dallah-300">
              <CalendarCheck className="size-4" />
            </span>
            <div>
              <p className="font-semibold text-majlis-900">{t('Your date is confirmed', 'تم تأكيد موعدك')}</p>
              <p className="text-[0.8125rem] leading-snug text-gypsum-600">
                {t('Approved by the majlis team', 'اعتمده فريق المجلس')} {req.decidedAt ? formatRelative(req.decidedAt, lang) : ''}.{' '}
                {hasOrders ? t('Track your bookings below.', 'تابع حجوزاتك أدناه.') : t('Now choose your services.', 'اختر خدماتك الآن.')}
              </p>
            </div>
          </div>
        )}

        <details className="group text-xs text-gypsum-600">
          <summary className="cursor-pointer list-none font-semibold text-majlis-700 [&::-webkit-details-marker]:hidden">
            {t('History', 'السجل')} <span className="inline-block transition-transform group-open:rotate-90">›</span>
          </summary>
          <ol className="mt-2 space-y-1.5 border-s-2 border-gypsum-200 ps-3">
            {req.history.map((h, i) => (
              <li key={i}>
                <Badge tone={h.status === 'approved' ? 'green' : h.status === 'rejected' ? 'red' : h.status === 'alternative' ? 'gold' : 'grey'}>{L(REQUEST_STATUS[h.status])}</Badge>{' '}
                <span>
                  {h.by === 'staff' ? t('majlis team', 'فريق المجلس') : t('you', 'أنت')} · {formatRelative(h.at, lang)}
                </span>
              </li>
            ))}
          </ol>
        </details>
      </div>
    </div>
  );
}

export function useServiceTotals(serviceIds: string[]) {
  const { state } = useStore();
  return useMemo(() => {
    const items = serviceIds.map((id) => state.services.find((s) => s.id === id)!).filter(Boolean);
    const total = items.reduce((s, x) => s + x.price, 0);
    return { items, total };
  }, [serviceIds, state.services]);
}
