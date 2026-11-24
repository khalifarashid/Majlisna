import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CalendarClock, Check, Inbox, Megaphone, MessageSquareText, Send, TriangleExclamationPoint, Users, X } from 'lucide-react';
import { useI18n } from '../../i18n/I18nProvider';
import { useStore } from '../../store/StoreProvider';
import { clashesFor, findClashes, suggestDates } from '../../domain/requests';
import { addDays, formatDate, formatRelative, todayISO } from '../../domain/dates';
import type { DateRequest, ISODate } from '../../domain/types';
import { ISSUE_CATEGORY, OCCASION, REQUEST_STATUS, SLR_THEME } from '../../i18n/labels';
import { Calendar, CalendarLegend, type DayState } from '../../components/Calendar';
import { Badge, Button, Card, Empty, Field, Input, Segmented, Select, Sheet, Stat, Textarea, cx } from '../../components/ui';
import { useToast } from '../../components/Toasts';

type Tab = 'pending' | 'decided' | 'all';

const QUICK_REASONS = [
  { en: 'Date reserved for an official event', ar: 'التاريخ محجوز لفعالية رسمية' },
  { en: 'Majlis maintenance that day', ar: 'صيانة في المجلس ذلك اليوم' },
  { en: 'Guest count exceeds capacity', ar: 'عدد الضيوف يتجاوز السعة' },
];

export function StaffDashboard() {
  const { t, L, lang } = useI18n();
  const { state } = useStore();
  const [majlisId, setMajlisId] = useState<string>('all');
  const [tab, setTab] = useState<Tab>('pending');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const scoped = state.requests.filter((r) => majlisId === 'all' || r.majlisId === majlisId);
  const clashes = useMemo(() => findClashes(state.requests), [state.requests]);
  const clashIds = new Set(Object.values(clashes).flat());
  const list = scoped
    .filter((r) => (tab === 'pending' ? r.status === 'pending' : tab === 'decided' ? r.status !== 'pending' : true))
    .sort((a, b) => (tab === 'pending' ? a.createdAt - b.createdAt : b.createdAt - a.createdAt));

  // Keep a sensible selection as the queue changes (including updates from other tabs).
  useEffect(() => {
    if (!selectedId || !list.some((r) => r.id === selectedId)) setSelectedId(list[0]?.id ?? null);
  }, [list.map((r) => r.id).join(','), selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  const pending = scoped.filter((r) => r.status === 'pending');
  const now = Date.now();
  const monthStart = todayISO().slice(0, 7);
  const approvedThisMonth = scoped.filter((r) => r.status === 'approved' && r.decidedAt && new Date(r.decidedAt).toISOString().slice(0, 7) === monthStart).length;
  const decided = scoped.filter((r) => r.decidedAt);
  const avgHours = decided.length ? decided.reduce((s, r) => s + (r.decidedAt! - r.createdAt), 0) / decided.length / 3_600_000 : 0;
  const oldest = pending.reduce((m, r) => Math.max(m, now - r.createdAt), 0) / 3_600_000;
  const selected = state.requests.find((r) => r.id === selectedId) ?? null;

  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-10 pt-6 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-dallah-600">{t('Government majlis team · sample', 'فريق المجلس الحكومي · تجريبي')}</p>
          <h1 className="display mt-1 text-3xl font-semibold text-majlis-900">{t('Date requests', 'طلبات المواعيد')}</h1>
        </div>
        <div className="w-full sm:w-64">
          <Select value={majlisId} onChange={(e) => setMajlisId(e.target.value)} aria-label={t('Majlis', 'المجلس')}>
            <option value="all">{t('All majlises', 'كل المجالس')}</option>
            {state.majlises.map((m) => (
              <option key={m.id} value={m.id}>
                {L(m.name)}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <Card className="mt-5 grid grid-cols-2 gap-5 p-5 lg:grid-cols-4">
        <Stat label={t('Waiting for a decision', 'بانتظار القرار')} value={pending.length} sub={pending.length ? t(`Oldest ${Math.round(oldest)} h`, `الأقدم ${Math.round(oldest)} ساعة`) : t('Queue clear', 'لا طلبات')} tone={pending.length ? 'gold' : 'green'} />
        <Stat label={t('Date clashes', 'تعارض المواعيد')} value={pending.filter((r) => clashIds.has(r.id)).length} sub={t('Same majlis, same date', 'نفس المجلس ونفس التاريخ')} tone={pending.some((r) => clashIds.has(r.id)) ? 'red' : 'default'} />
        <Stat label={t('Approved this month', 'المعتمدة هذا الشهر')} value={approvedThisMonth} />
        <Stat label={t('Average response', 'متوسط وقت الرد')} value={`${avgHours.toFixed(1)} h`} sub={t('Target: under 48 h', 'الهدف: أقل من ٤٨ ساعة')} tone={avgHours <= 48 ? 'green' : 'red'} />
      </Card>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        {/* Queue */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-gypsum-200 px-4 py-3">
            <Segmented
              size="sm"
              value={tab}
              onChange={setTab}
              options={[
                { value: 'pending', label: `${t('Pending', 'قيد الانتظار')} · ${pending.length}` },
                { value: 'decided', label: t('Decided', 'تم البت') },
                { value: 'all', label: t('All', 'الكل') },
              ]}
            />
          </div>
          {list.length === 0 ? (
            <Empty icon={<Inbox className="size-5" />} title={t('No requests here', 'لا توجد طلبات')} body={t('New requests from residents appear instantly.', 'تظهر طلبات المواطنين الجديدة فوراً.')} />
          ) : (
            <ul className="max-h-[560px] divide-y divide-gypsum-100 overflow-y-auto scroll-thin">
              <AnimatePresence initial={false}>
                {list.map((r) => {
                  const m = state.majlises.find((x) => x.id === r.majlisId)!;
                  const clash = clashIds.has(r.id) && r.status === 'pending';
                  const isNew = Date.now() - r.createdAt < 10 * 60_000;
                  return (
                    <motion.li key={r.id} layout initial={{ opacity: 0, backgroundColor: 'var(--color-dallah-100)' }} animate={{ opacity: 1, backgroundColor: 'rgba(0,0,0,0)' }} transition={{ duration: 1.2 }}>
                      <button
                        onClick={() => {
                          setSelectedId(r.id);
                          setMobileOpen(true);
                        }}
                        className={cx('flex w-full items-center gap-3 px-4 py-3 text-start transition-colors hover:bg-majlis-50/60', selectedId === r.id && 'bg-majlis-50 lg:shadow-[inset_3px_0_0_var(--color-majlis-700)] rtl:lg:shadow-[inset_-3px_0_0_var(--color-majlis-700)]')}
                      >
                        <div className="num grid w-14 shrink-0 text-center">
                          <span className="text-[0.6875rem] uppercase text-gypsum-500">{formatDate(r.date, lang, { weekday: 'short' })}</span>
                          <span className="display text-lg font-semibold leading-tight text-majlis-900">{formatDate(r.date, lang, { day: 'numeric', month: 'short' })}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="flex items-center gap-2 truncate text-sm font-semibold text-majlis-950">
                            {r.residentName}
                            {r.residentId === state.me.id && <Badge tone="ink">{t('Demo resident', 'المواطن التجريبي')}</Badge>}
                            {isNew && r.status === 'pending' && <Badge tone="gold">{t('New', 'جديد')}</Badge>}
                          </p>
                          <p className="truncate text-xs text-gypsum-600">
                            {L(m.name)} · {L(OCCASION[r.occasion])} · {r.guests} {t('guests', 'ضيف')}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          {clash ? (
                            <Badge tone="red" icon={<TriangleExclamationPoint className="size-3" />}>
                              {t('Clash', 'تعارض')}
                            </Badge>
                          ) : r.status !== 'pending' ? (
                            <Badge tone={r.status === 'approved' ? 'green' : r.status === 'rejected' ? 'red' : r.status === 'alternative' ? 'gold' : 'grey'}>{L(REQUEST_STATUS[r.status])}</Badge>
                          ) : null}
                          <span className="text-[0.6875rem] text-gypsum-500">{formatRelative(r.createdAt, lang)}</span>
                        </div>
                      </button>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          )}
        </Card>

        {/* Detail (desktop) */}
        <div className="hidden lg:block">{selected ? <RequestPanel req={selected} key={selected.id} /> : <Card className="p-6"><Empty title={t('Select a request', 'اختر طلباً')} /></Card>}</div>
      </div>

      <div className="lg:hidden">
        <Sheet open={mobileOpen && !!selected} onClose={() => setMobileOpen(false)} title={t('Request', 'الطلب')}>
          {selected && <RequestPanel req={selected} key={selected.id} bare />}
        </Sheet>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <MajlisCalendar majlisId={majlisId === 'all' ? state.majlises[0].id : majlisId} />
        <Reports />
        <Compose defaultMajlis={majlisId === 'all' ? state.majlises[0].id : majlisId} />
      </div>
    </div>
  );
}

function RequestPanel({ req, bare }: { req: DateRequest; bare?: boolean }) {
  const { t, L, lang } = useI18n();
  const { state, dispatch } = useStore();
  const toast = useToast();
  const [mode, setMode] = useState<'idle' | 'reject' | 'suggest'>('idle');
  const [reason, setReason] = useState('');
  const [alt, setAlt] = useState<ISODate | null>(null);
  const [note, setNote] = useState('');
  const m = state.majlises.find((x) => x.id === req.majlisId)!;
  const others = clashesFor(req, state.requests);
  const overCap = req.guests > m.capacity;
  const taken = state.requests.some((r) => r.id !== req.id && r.majlisId === req.majlisId && r.date === req.date && r.status === 'approved');
  const suggestions = useMemo(() => suggestDates(state.requests, req.majlisId, addDays(req.date, 1), 4), [state.requests, req.majlisId, req.date]);
  const at = () => Date.now();

  const approve = () => dispatch({ type: 'decideRequest', id: req.id, decision: { kind: 'approve' }, at: at() }) && toast(t(`Approved. ${req.residentName} has been notified.`, `تم الاعتماد وإشعار ${req.residentName}.`));
  const reject = () => {
    if (dispatch({ type: 'decideRequest', id: req.id, decision: { kind: 'reject', reason }, at: at() })) {
      toast(t('Request declined with reason.', 'تم رفض الطلب مع ذكر السبب.'), 'info');
      setMode('idle');
    }
  };
  const suggest = () => {
    if (alt && dispatch({ type: 'decideRequest', id: req.id, decision: { kind: 'suggest', date: alt, note: note.trim() || undefined }, at: at() })) {
      toast(t('Alternative date sent.', 'تم إرسال الموعد البديل.'));
      setMode('idle');
    }
  };

  const body = (
    <div className="space-y-4">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-gypsum-500">#{req.id.slice(-5).toUpperCase()} · {formatRelative(req.createdAt, lang)}</p>
            <h2 className="display text-2xl font-semibold text-majlis-900">{req.residentName}</h2>
          </div>
          <Badge tone={req.status === 'approved' ? 'green' : req.status === 'rejected' ? 'red' : req.status === 'pending' ? 'gold' : 'grey'}>{L(REQUEST_STATUS[req.status])}</Badge>
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-3 rounded-2xl bg-gypsum-100 p-3 text-sm">
          <div>
            <dt className="text-xs text-gypsum-500">{t('Majlis', 'المجلس')}</dt>
            <dd className="font-semibold text-majlis-950">{L(m.name)}</dd>
          </div>
          <div>
            <dt className="text-xs text-gypsum-500">{t('Date', 'التاريخ')}</dt>
            <dd className="font-semibold text-majlis-950">{formatDate(req.date, lang, { weekday: 'long', day: 'numeric', month: 'short' })}</dd>
          </div>
          <div>
            <dt className="text-xs text-gypsum-500">{t('Occasion', 'المناسبة')}</dt>
            <dd className="font-semibold text-majlis-950">{L(OCCASION[req.occasion])}</dd>
          </div>
          <div>
            <dt className="text-xs text-gypsum-500">{t('Guests', 'الضيوف')}</dt>
            <dd className={cx('flex items-center gap-1 font-semibold', overCap ? 'text-sadu-600' : 'text-majlis-950')}>
              <Users className="size-3.5" /> {req.guests} / {m.capacity}
            </dd>
          </div>
        </dl>
        {req.note && <p className="mt-3 rounded-xl border-s-4 border-dallah-400 bg-dallah-50 px-3 py-2 text-sm text-gypsum-700">“{req.note}”</p>}
      </div>

      {(others.length > 0 || overCap || taken) && req.status === 'pending' && (
        <div className="space-y-1.5 rounded-2xl bg-sadu-50 p-3 text-[0.8125rem] text-sadu-700 ring-1 ring-sadu-100">
          {taken && <p className="font-semibold">{t('This date is already approved for another family.', 'هذا التاريخ معتمد لعائلة أخرى.')}</p>}
          {others.filter((o) => o.status === 'pending').map((o) => (
            <p key={o.id}>
              <TriangleExclamationPoint className="me-1 inline size-3.5" />
              {t(`${o.residentName} also requested this date (${formatRelative(o.createdAt, 'en')}).`, `طلب ${o.residentName} هذا التاريخ أيضاً (${formatRelative(o.createdAt, 'ar')}).`)}
            </p>
          ))}
          {overCap && <p>{t('Guest count is above this majlis’s capacity.', 'عدد الضيوف أكبر من سعة المجلس.')}</p>}
        </div>
      )}

      {req.status === 'pending' && (
        <>
          <AnimatePresence mode="wait" initial={false}>
            {mode === 'idle' && (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid gap-2">
                <Button size="lg" icon={<Check className="size-4" />} onClick={approve} disabled={taken}>
                  {t('Approve date', 'اعتماد الموعد')}
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="ghost" icon={<CalendarClock className="size-4" />} onClick={() => setMode('suggest')}>
                    {t('Suggest date', 'اقتراح موعد')}
                  </Button>
                  <Button variant="danger" icon={<X className="size-4" />} onClick={() => setMode('reject')}>
                    {t('Decline', 'رفض')}
                  </Button>
                </div>
              </motion.div>
            )}
            {mode === 'suggest' && (
              <motion.div key="suggest" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3 rounded-2xl bg-dallah-50/60 p-3 ring-1 ring-dallah-100">
                <p className="text-[0.6875rem] text-gypsum-500">{L(SLR_THEME.scheduling)}</p>
                <p className="text-[0.8125rem] font-semibold text-majlis-900">{t('Nearest free evenings (Thu–Sat first)', 'أقرب الأمسيات المتاحة (الخميس–السبت أولاً)')}</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((d) => (
                    <button key={d} onClick={() => setAlt(d)} className={cx('rounded-xl px-3 py-2 text-sm font-semibold ring-1 transition-all', alt === d ? 'bg-majlis-800 text-gypsum-50 ring-majlis-800' : 'bg-white text-majlis-800 ring-gypsum-300 hover:ring-majlis-400')}>
                      {formatDate(d, lang)}
                    </button>
                  ))}
                </div>
                <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('Optional note to the family', 'ملاحظة اختيارية للعائلة')} />
                <div className="flex gap-2">
                  <Button className="flex-1" disabled={!alt} onClick={suggest} icon={<Send className="flip-rtl size-4" />}>
                    {t('Send suggestion', 'أرسل الاقتراح')}
                  </Button>
                  <Button variant="quiet" onClick={() => setMode('idle')}>
                    {t('Back', 'رجوع')}
                  </Button>
                </div>
                <p className="text-[0.6875rem] text-gypsum-500">{t('Free dates are calculated from approved bookings. You make the final call.', 'تُحسب المواعيد المتاحة من الحجوزات المعتمدة، والقرار النهائي لك.')}</p>
              </motion.div>
            )}
            {mode === 'reject' && (
              <motion.div key="reject" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3 rounded-2xl bg-sadu-50/60 p-3 ring-1 ring-sadu-100">
                <p className="text-[0.8125rem] font-semibold text-majlis-900">{t('Reason (sent to the family)', 'السبب (يُرسل للعائلة)')}</p>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_REASONS.map((q) => (
                    <button key={q.en} onClick={() => setReason(lang === 'ar' ? q.ar : q.en)} className="rounded-full bg-white px-2.5 py-1 text-xs text-gypsum-700 ring-1 ring-gypsum-300 hover:ring-sadu-300">
                      {lang === 'ar' ? q.ar : q.en}
                    </button>
                  ))}
                </div>
                <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t('Write a clear reason', 'اكتب سبباً واضحاً')} />
                <div className="flex gap-2">
                  <Button variant="danger" className="flex-1" disabled={!reason.trim()} onClick={reject}>
                    {t('Decline request', 'رفض الطلب')}
                  </Button>
                  <Button variant="quiet" onClick={() => setMode('idle')}>
                    {t('Back', 'رجوع')}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {req.status !== 'pending' && (
        <ol className="space-y-2 border-s-2 border-gypsum-200 ps-3 text-xs text-gypsum-600">
          {req.history.map((h, i) => (
            <li key={i}>
              <span className="font-semibold text-majlis-900">{L(REQUEST_STATUS[h.status])}</span> · {h.by === 'staff' ? t('majlis team', 'فريق المجلس') : t('resident', 'المواطن')} · {formatRelative(h.at, lang)}
              {h.note && <span className="block text-gypsum-500">“{h.note}”</span>}
              {h.date && <span className="block text-gypsum-500">{h.date}</span>}
            </li>
          ))}
        </ol>
      )}
    </div>
  );

  if (bare) return body;
  return <Card className="sticky top-24 p-5">{body}</Card>;
}

function MajlisCalendar({ majlisId }: { majlisId: string }) {
  const { t, L } = useI18n();
  const { state } = useStore();
  const [id, setId] = useState(majlisId);
  useEffect(() => {
    setId(majlisId);
  }, [majlisId]);
  const today = todayISO();
  const stateOf = (d: ISODate): DayState => {
    if (d < today) return 'past';
    const reqs = state.requests.filter((r) => r.majlisId === id && r.date === d);
    if (reqs.some((r) => r.status === 'approved')) return 'mine';
    if (reqs.some((r) => r.status === 'pending')) return 'pending';
    return 'free';
  };
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-majlis-950">{t('Bookings calendar', 'تقويم الحجوزات')}</p>
        <select value={id} onChange={(e) => setId(e.target.value)} className="rounded-lg bg-gypsum-100 px-2 py-1 text-xs font-semibold text-majlis-800 outline-none">
          {state.majlises.map((m) => (
            <option key={m.id} value={m.id}>
              {L(m.name)}
            </option>
          ))}
        </select>
      </div>
      <Calendar stateOf={stateOf} compact />
      <div className="mt-3">
        <CalendarLegend
          items={[
            { state: 'mine', label: t('Approved', 'معتمد') },
            { state: 'pending', label: t('Pending', 'قيد الانتظار') },
            { state: 'free', label: t('Free', 'متاح') },
          ]}
        />
      </div>
    </Card>
  );
}

function Reports() {
  const { t, L, lang } = useI18n();
  const { state, dispatch } = useStore();
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <MessageSquareText className="size-4 text-majlis-600" />
        <p className="text-sm font-semibold text-majlis-950">{t('Community reports', 'بلاغات المجتمع')}</p>
      </div>
      {state.issues.length === 0 ? (
        <p className="text-sm text-gypsum-500">{t('No reports.', 'لا توجد بلاغات.')}</p>
      ) : (
        <ul className="space-y-3">
          {state.issues.slice(0, 6).map((i) => (
            <li key={i.id} className="rounded-xl bg-gypsum-100 p-3">
              <div className="flex items-center justify-between gap-2 text-[0.6875rem] text-gypsum-500">
                <span>
                  {L(ISSUE_CATEGORY[i.category])} · {L(state.majlises.find((m) => m.id === i.majlisId)!.name)}
                </span>
                <span>{formatRelative(i.createdAt, lang)}</span>
              </div>
              <p className="mt-1 text-[0.8125rem] text-gypsum-800">{i.text}</p>
              <div className="mt-2 flex gap-1">
                {(['received', 'in_review', 'resolved'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => dispatch({ type: 'updateIssue', id: i.id, status: s })}
                    className={cx('rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold transition-colors', i.status === s ? 'bg-majlis-800 text-gypsum-50' : 'bg-white text-gypsum-600 ring-1 ring-gypsum-200 hover:ring-majlis-300')}
                  >
                    {s === 'received' ? t('Received', 'مستلم') : s === 'in_review' ? t('In review', 'قيد المراجعة') : t('Resolved', 'تم الحل')}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function Compose({ defaultMajlis }: { defaultMajlis: string }) {
  const { t, L } = useI18n();
  const { state, dispatch } = useStore();
  const toast = useToast();
  const [majlisId, setMajlisId] = useState(defaultMajlis);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  useEffect(() => {
    setMajlisId(defaultMajlis);
  }, [defaultMajlis]);
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <Megaphone className="size-4 text-majlis-600" />
        <p className="text-sm font-semibold text-majlis-950">{t('Post an announcement', 'نشر إعلان')}</p>
      </div>
      <div className="space-y-3">
        <Field label={t('Majlis', 'المجلس')}>
          <Select value={majlisId} onChange={(e) => setMajlisId(e.target.value)}>
            {state.majlises.map((m) => (
              <option key={m.id} value={m.id}>
                {L(m.name)}
              </option>
            ))}
          </Select>
        </Field>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('Title', 'العنوان')} maxLength={80} />
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder={t('What should residents know?', 'ماذا يجب أن يعرف السكان؟')} maxLength={300} />
        <Button
          block
          disabled={!title.trim() || !body.trim()}
          onClick={() => {
            dispatch({ type: 'postAnnouncement', majlisId, title: title.trim(), body: body.trim(), at: Date.now() });
            setTitle('');
            setBody('');
            toast(t('Posted. Residents see it on their home screen.', 'تم النشر، ويظهر للسكان في الصفحة الرئيسية.'));
          }}
          icon={<Send className="flip-rtl size-4" />}
        >
          {t('Post', 'انشر')}
        </Button>
      </div>
    </Card>
  );
}
