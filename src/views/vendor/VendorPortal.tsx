import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { BadgeCheck, Check, CircleCheck, Inbox, ShieldCheck, Sparkles, Star, X } from 'lucide-react';
import { useI18n } from '../../i18n/I18nProvider';
import { useStore } from '../../store/StoreProvider';
import { CATEGORY, ORDER_STATUS, SLR_THEME } from '../../i18n/labels';
import { formatAED } from '../../domain/money';
import { formatDate, formatRelative } from '../../domain/dates';
import type { OrderStatus } from '../../domain/types';
import { summarizeReviews, type ReviewInsight } from '../../ai/features';
import { AiBadge } from '../../components/AiBadge';
import { Badge, Button, Card, Empty, Segmented, Select, Stat, cx } from '../../components/ui';
import { useToast } from '../../components/Toasts';
import { CATEGORY_ICON } from '../resident/VendorMarket';

type Tab = 'awaiting_vendor' | 'confirmed' | 'completed' | 'declined';

export function VendorPortal() {
  const { t, L, lang } = useI18n();
  const { state, dispatch } = useStore();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>('awaiting_vendor');
  const vendor = state.vendors.find((v) => v.id === state.vendorId) ?? state.vendors[0];
  const orders = state.orders.filter((o) => o.vendorId === vendor.id);
  const shown = orders.filter((o) => o.status === tab).sort((a, b) => a.eventDate.localeCompare(b.eventDate));
  const completed = orders.filter((o) => o.status === 'completed');
  const gross = completed.reduce((s, o) => s + o.amount, 0);
  const fee = completed.reduce((s, o) => s + o.fee, 0);
  const net = completed.reduce((s, o) => s + o.vendorNet, 0);
  const upcomingNet = orders.filter((o) => o.status === 'confirmed').reduce((s, o) => s + o.vendorNet, 0);
  const Icon = CATEGORY_ICON[vendor.category];
  const count = (s: OrderStatus) => orders.filter((o) => o.status === s).length;

  const update = (id: string, status: 'confirmed' | 'declined' | 'completed') => {
    if (dispatch({ type: 'vendorUpdateOrder', id, status, at: Date.now() })) {
      toast(
        status === 'confirmed'
          ? t('Order confirmed. The family has been notified.', 'تم تأكيد الطلب وإشعار العائلة.')
          : status === 'completed'
            ? t('Marked as completed. Payout is on its way.', 'تم وضع علامة الإكمال، والمستحقات في الطريق.')
            : t('Order declined. The family is refunded.', 'تم رفض الطلب واسترداد المبلغ للعائلة.'),
        status === 'declined' ? 'info' : 'success',
      );
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-10 pt-6 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="arch grid h-16 w-14 place-items-center bg-majlis-800 text-dallah-300 [--arch-base:10px] [--arch-rise:44%]">
            <Icon className="size-6" />
          </span>
          <div>
            <p className="eyebrow text-dallah-600">{t('Vendor portal · sample', 'بوابة المورد · تجريبي')}</p>
            <h1 className="display text-3xl font-semibold text-majlis-900">{L(vendor.name)}</h1>
          </div>
        </div>
        <div className="w-full sm:w-72">
          <Select value={vendor.id} onChange={(e) => dispatch({ type: 'setVendor', vendorId: e.target.value })} aria-label={t('Signed in as', 'تسجيل الدخول باسم')}>
            {state.vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {L(v.name)} · {L(CATEGORY[v.category])}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-5">
          <Card className="grid grid-cols-2 gap-5 p-5 md:grid-cols-4">
            <Stat label={t('Waiting for you', 'بانتظارك')} value={count('awaiting_vendor')} tone={count('awaiting_vendor') ? 'gold' : 'default'} sub={t('Confirm within 24 h', 'أكّد خلال ٢٤ ساعة')} />
            <Stat label={t('Upcoming payout', 'مستحقات قادمة')} value={formatAED(upcomingNet, lang)} sub={t(`${count('confirmed')} confirmed`, `${count('confirmed')} مؤكدة`)} />
            <Stat label={t('Completed sales', 'المبيعات المكتملة')} value={formatAED(gross, lang)} sub={t(`${completed.length} services`, `${completed.length} خدمات`)} />
            <Stat label={t('Paid to you (92%)', 'المدفوع لك (٩٢٪)')} value={formatAED(net, lang)} tone="green" sub={t(`Majlisna fee ${formatAED(fee, 'en')}`, `رسوم مجلسنا ${formatAED(fee, 'ar')}`)} />
          </Card>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto border-b border-gypsum-200 px-4 py-3 no-scrollbar">
              <Segmented
                size="sm"
                value={tab}
                onChange={setTab}
                options={(['awaiting_vendor', 'confirmed', 'completed', 'declined'] as Tab[]).map((s) => ({ value: s, label: `${L(ORDER_STATUS[s])} · ${count(s)}` }))}
              />
            </div>
            {shown.length === 0 ? (
              <Empty icon={<Inbox className="size-5" />} title={t('Nothing here', 'لا شيء هنا')} body={t('New bookings from residents appear here instantly.', 'تظهر حجوزات المواطنين الجديدة هنا فوراً.')} />
            ) : (
              <ul className="divide-y divide-gypsum-100">
                <AnimatePresence initial={false}>
                  {shown.map((o) => {
                    const s = state.services.find((x) => x.id === o.serviceId)!;
                    const m = state.majlises.find((x) => x.id === o.majlisId);
                    return (
                      <motion.li key={o.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: 20 }} className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3.5">
                        <div className="num grid w-14 shrink-0 text-center">
                          <span className="text-[0.6875rem] uppercase text-gypsum-500">{formatDate(o.eventDate, lang, { weekday: 'short' })}</span>
                          <span className="display text-lg font-semibold leading-tight text-majlis-900">{formatDate(o.eventDate, lang, { day: 'numeric', month: 'short' })}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-majlis-950">{o.residentName}</p>
                          <p className="truncate text-xs text-gypsum-600">
                            {L(s.name)} · {m && L(m.name)}
                          </p>
                        </div>
                        <div className="text-end">
                          <p className="num text-sm text-majlis-950">{formatAED(o.amount, lang)}</p>
                          <p className="num text-[0.6875rem] text-gypsum-500">
                            {t('you get', 'لك')} {formatAED(o.vendorNet, lang)}
                          </p>
                        </div>
                        <div className="flex w-full justify-end gap-2 sm:w-auto">
                          {o.status === 'awaiting_vendor' && (
                            <>
                              <Button size="sm" icon={<Check className="size-3.5" />} onClick={() => update(o.id, 'confirmed')}>
                                {t('Confirm', 'تأكيد')}
                              </Button>
                              <Button size="sm" variant="danger" icon={<X className="size-3.5" />} onClick={() => update(o.id, 'declined')}>
                                {t('Decline', 'رفض')}
                              </Button>
                            </>
                          )}
                          {o.status === 'confirmed' && (
                            <Button size="sm" variant="ghost" icon={<CircleCheck className="size-3.5" />} onClick={() => update(o.id, 'completed')}>
                              {t('Mark completed', 'تم التنفيذ')}
                            </Button>
                          )}
                          {(o.status === 'completed' || o.status === 'declined') && (
                            <Badge tone={o.status === 'completed' ? 'green' : 'red'}>{formatRelative(o.updatedAt, lang)}</Badge>
                          )}
                        </div>
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="p-5">
            <div className="flex items-center gap-2">
              {vendor.verified ? <BadgeCheck className="size-5 text-majlis-600" /> : <ShieldCheck className="size-5 text-dallah-600" />}
              <p className="font-semibold text-majlis-950">{vendor.verified ? t('Verified by Majlisna', 'موثق من مجلسنا') : t('Verification in progress', 'التحقق قيد الإجراء')}</p>
            </div>
            <dl className="mt-3 space-y-1.5 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-gypsum-500">{t('Licence', 'الرخصة')}</dt>
                <dd className="num text-majlis-950">{vendor.licenceNo}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-gypsum-500">{t('Category', 'الفئة')}</dt>
                <dd className="text-majlis-950">{L(CATEGORY[vendor.category])}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-gypsum-500">{t('In business since', 'منذ')}</dt>
                <dd className="num text-majlis-950">{vendor.since}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-gypsum-500">{t('Commission', 'العمولة')}</dt>
                <dd className="text-majlis-950">{t('8% on completed paid services', '٨٪ على الخدمات المدفوعة المكتملة')}</dd>
              </div>
            </dl>
            {gross > 0 && (
              <div className="mt-4">
                <div className="flex h-3 gap-[2px] overflow-hidden rounded-full">
                  <div className="h-full rounded-s-full bg-majlis-700" style={{ flex: net }} title={t('Your payout', 'مستحقاتك')} />
                  <div className="h-full rounded-e-full bg-dallah-500" style={{ flex: fee }} title="Majlisna" />
                </div>
                <div className="mt-1.5 flex justify-between text-[0.6875rem] text-gypsum-600">
                  <span>
                    {t('You', 'أنت')} · <span className="num">{formatAED(net, lang)}</span>
                  </span>
                  <span>
                    Majlisna · <span className="num">{formatAED(fee, lang)}</span>
                  </span>
                </div>
              </div>
            )}
          </Card>
          <ReviewsCard vendorId={vendor.id} />
        </div>
      </div>
    </div>
  );
}

function ReviewsCard({ vendorId }: { vendorId: string }) {
  const { t, lang } = useI18n();
  const { state } = useStore();
  const vendor = state.vendors.find((v) => v.id === vendorId)!;
  const reviews = state.reviews.filter((r) => r.vendorId === vendorId);
  const [insight, setInsight] = useState<ReviewInsight | null>(null);
  const [source, setSource] = useState<'claude' | 'fallback'>();
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    setInsight(null);
    setSource(undefined);
  }, [vendorId, lang]);

  const run = async () => {
    setLoading(true);
    const res = await summarizeReviews({ vendor, reviews, lang, useAi: state.aiPrefs.enabled });
    setInsight(res.data);
    setSource(res.source);
    setLoading(false);
  };
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / Math.max(1, reviews.length);

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-majlis-950">{t('Reviews', 'التقييمات')}</p>
        <span className="flex items-center gap-1 text-sm">
          <Star className="size-4 fill-dallah-400 text-dallah-400" />
          <span className="num">{reviews.length ? avg.toFixed(1) : '–'}</span>
          <span className="text-gypsum-500">({reviews.length})</span>
        </span>
      </div>

      <div className="mt-4 rounded-2xl bg-majlis-900 p-4 text-gypsum-50">
        <div className="flex items-center justify-between gap-2">
          <AiBadge dark source={source} theme={SLR_THEME.reviews} loading={loading} />
        </div>
        {!insight ? (
          <Button variant="gold" size="sm" className="mt-3" disabled={loading || reviews.length === 0} onClick={run} icon={<Sparkles className="size-3.5" />}>
            {loading ? t('Reading reviews…', 'جارٍ قراءة التقييمات…') : t('Summarise what customers say', 'لخّص آراء العملاء')}
          </Button>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 space-y-3">
            <div className="flex items-center gap-3">
              <span className="num text-3xl text-dallah-300">{insight.score}</span>
              <span className="text-sm">
                <span className="block font-semibold">
                  {insight.sentiment === 'positive' ? t('Mostly positive', 'إيجابية غالباً') : insight.sentiment === 'mixed' ? t('Mixed', 'متباينة') : t('Mostly negative', 'سلبية غالباً')}
                </span>
                <span className="text-xs text-majlis-200">{t('satisfaction out of 100', 'رضا من ١٠٠')}</span>
              </span>
            </div>
            {insight.praise.length > 0 && (
              <div>
                <p className="mb-1 text-[0.6875rem] font-semibold text-majlis-200">{t('Customers praise', 'يمدح العملاء')}</p>
                <div className="flex flex-wrap gap-1.5">
                  {insight.praise.map((p) => (
                    <span key={p} className="rounded-full bg-white/10 px-2 py-0.5 text-xs">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {insight.concerns.length > 0 && (
              <div>
                <p className="mb-1 text-[0.6875rem] font-semibold text-majlis-200">{t('Watch out for', 'انتبه إلى')}</p>
                <div className="flex flex-wrap gap-1.5">
                  {insight.concerns.map((p) => (
                    <span key={p} className="rounded-full bg-sadu-500/25 px-2 py-0.5 text-xs text-sadu-50">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {insight.suggestion && <p className="rounded-xl bg-white/5 p-2.5 text-[0.8125rem] leading-snug text-majlis-50">→ {insight.suggestion}</p>}
          </motion.div>
        )}
      </div>

      <ul className="mt-4 max-h-72 space-y-3 overflow-y-auto scroll-thin">
        {reviews.map((r) => (
          <li key={r.id} className="border-b border-gypsum-100 pb-3 last:border-0">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-majlis-900">{r.author}</span>
              <span className="flex gap-0.5" aria-label={`${r.rating} / 5`}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} className={cx('size-3', n <= r.rating ? 'fill-dallah-400 text-dallah-400' : 'text-gypsum-300')} />
                ))}
              </span>
            </div>
            <p dir="auto" className="mt-1 text-[0.8125rem] leading-snug text-gypsum-700">
              {r.text}
            </p>
            <p className="mt-0.5 text-[0.6875rem] text-gypsum-400">{formatRelative(r.at, lang)}</p>
          </li>
        ))}
      </ul>
    </Card>
  );
}
