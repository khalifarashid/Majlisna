import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { BadgeCheck, Camera, Check, Coffee, CreditCard, Drum, LoaderCircle, Plus, ShieldCheck, Star, UtensilsCrossed } from 'lucide-react';
import { useI18n } from '../../i18n/I18nProvider';
import { useStore } from '../../store/StoreProvider';
import { CATEGORY, ORDER_STATUS } from '../../i18n/labels';
import { formatAED, splitCommission } from '../../domain/money';
import type { ServiceCategory } from '../../domain/types';
import { Badge, Button, Segmented, SectionTitle, Sheet, Textarea, cx } from '../../components/ui';
import { useToast } from '../../components/Toasts';
import { useServiceTotals } from './Plan';

export const CATEGORY_ICON: Record<ServiceCategory, typeof Coffee> = { coffee: Coffee, ayyala: Drum, media: Camera, catering: UtensilsCrossed };

export function VendorMarket({ requestId }: { requestId: string }) {
  const { t, L, lang } = useI18n();
  const { state, dispatch } = useStore();
  const [cat, setCat] = useState<ServiceCategory>('coffee');
  const [checkout, setCheckout] = useState(false);
  const booked = new Set(state.orders.filter((o) => o.requestId === requestId && o.status !== 'declined').map((o) => state.services.find((s) => s.id === o.serviceId)?.category));
  const { items, total } = useServiceTotals(state.cart);

  return (
    <section>
      <SectionTitle eyebrow={t('Step 3 · registered vendors', 'الخطوة ٣ · موردون مسجلون')} title={t('Book your services', 'احجز خدماتك')} />
      <div className="-mx-4 mt-3 overflow-x-auto px-4 no-scrollbar">
        <Segmented
          size="sm"
          value={cat}
          onChange={setCat}
          options={(Object.keys(CATEGORY) as ServiceCategory[]).map((c) => {
            const Icon = CATEGORY_ICON[c];
            return {
              value: c,
              label: (
                <span className="inline-flex items-center gap-1.5">
                  <Icon className="size-3.5" />
                  {L(CATEGORY[c])}
                  {booked.has(c) && <Check className="size-3 text-majlis-600" />}
                </span>
              ),
            };
          })}
        />
      </div>

      <AnimatePresence mode="popLayout" initial={false}>
        <motion.ul key={cat} className="mt-3 space-y-2.5" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }}>
          {state.services
            .filter((s) => s.category === cat)
            .map((s) => {
              const v = state.vendors.find((x) => x.id === s.vendorId)!;
              const inCart = state.cart.includes(s.id);
              const reviews = state.reviews.filter((r) => r.vendorId === v.id).length;
              return (
                <li key={s.id} className={cx('rounded-2xl bg-white p-4 shadow-card ring-1 transition-colors', inCart ? 'ring-majlis-600' : 'ring-gypsum-200/70')}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 text-xs font-semibold text-gypsum-600">
                        {L(v.name)}
                        {v.verified ? <BadgeCheck className="size-3.5 text-majlis-600" aria-label={t('Verified', 'موثق')} /> : <Badge tone="gold">{t('Licence check pending', 'التحقق من الرخصة قيد الإجراء')}</Badge>}
                      </p>
                      <h3 className="mt-0.5 font-semibold text-majlis-950">{L(s.name)}</h3>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-gypsum-500">
                        <Star className="size-3 fill-dallah-400 text-dallah-400" />
                        <span className="num">{v.rating.toFixed(1)}</span> · {t(`${reviews} reviews`, `${reviews} تقييمات`)}
                      </p>
                    </div>
                    <div className="text-end">
                      <p className="num text-lg font-medium text-majlis-900">{formatAED(s.price, lang)}</p>
                      <p className="text-[0.6875rem] text-gypsum-500">{L(s.unit)}</p>
                    </div>
                  </div>
                  <ul className="mt-2.5 flex flex-wrap gap-1.5">
                    {s.includes.map((inc, i) => (
                      <li key={i} className="rounded-full bg-gypsum-100 px-2 py-0.5 text-[0.6875rem] text-gypsum-700">
                        {L(inc)}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="mt-3"
                    size="sm"
                    variant={inCart ? 'primary' : 'ghost'}
                    block
                    icon={inCart ? <Check className="size-3.5" /> : <Plus className="size-3.5" />}
                    onClick={() => dispatch({ type: 'toggleCart', serviceId: s.id })}
                  >
                    {inCart ? t('In your plan', 'في خطتك') : t('Add to plan', 'أضف إلى الخطة')}
                  </Button>
                </li>
              );
            })}
        </motion.ul>
      </AnimatePresence>

      <AnimatePresence>
        {items.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
            className="sticky bottom-24 z-10 mt-4 flex items-center gap-3 rounded-2xl bg-majlis-900 p-3 ps-4 text-gypsum-50 shadow-lift"
          >
            <div className="min-w-0 flex-1">
              <p className="text-xs text-majlis-200">{t(`${items.length} services`, `${items.length} خدمات`)}</p>
              <p className="num text-lg">{formatAED(total, lang)}</p>
            </div>
            <Button variant="gold" onClick={() => setCheckout(true)} icon={<CreditCard className="size-4" />}>
              {t('Review & pay', 'مراجعة والدفع')}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <CheckoutSheet open={checkout} onClose={() => setCheckout(false)} requestId={requestId} />
    </section>
  );
}

function CheckoutSheet({ open, onClose, requestId }: { open: boolean; onClose: () => void; requestId: string }) {
  const { t, L, lang } = useI18n();
  const { state, dispatch } = useStore();
  const toast = useToast();
  const { items, total } = useServiceTotals(state.cart);
  const [paying, setPaying] = useState(false);
  const split = splitCommission(total);

  const pay = () => {
    setPaying(true);
    window.setTimeout(() => {
      const ok = dispatch({ type: 'checkout', requestId, at: Date.now() });
      setPaying(false);
      if (ok) {
        onClose();
        toast(t('Paid. Vendors have been notified.', 'تم الدفع وإشعار الموردين.'));
      }
    }, 1100);
  };

  return (
    <Sheet open={open} onClose={onClose} title={t('Review & pay', 'مراجعة والدفع')}>
      <ul className="divide-y divide-gypsum-200 rounded-2xl bg-white ring-1 ring-gypsum-200">
        {items.map((s) => {
          const Icon = CATEGORY_ICON[s.category];
          return (
            <li key={s.id} className="flex items-center gap-3 px-4 py-3">
              <Icon className="size-4 shrink-0 text-majlis-600" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-majlis-950">{L(s.name)}</p>
                <p className="truncate text-xs text-gypsum-500">{L(state.vendors.find((v) => v.id === s.vendorId)!.name)}</p>
              </div>
              <span className="num text-sm">{formatAED(s.price, lang)}</span>
            </li>
          );
        })}
      </ul>
      <div className="mt-4 space-y-1.5 px-1 text-sm">
        <div className="flex justify-between font-semibold text-majlis-950">
          <span>{t('Total', 'الإجمالي')}</span>
          <span className="num">{formatAED(total, lang)}</span>
        </div>
        <div className="flex justify-between text-xs text-gypsum-600">
          <span>{t('Goes to vendors (92%)', 'يذهب للموردين (٩٢٪)')}</span>
          <span className="num">{formatAED(split.vendor, lang)}</span>
        </div>
        <div className="flex justify-between text-xs text-gypsum-600">
          <span>{t('Majlisna fee, included (8%)', 'رسوم مجلسنا، مشمولة (٨٪)')}</span>
          <span className="num">{formatAED(split.fee, lang)}</span>
        </div>
      </div>
      <p className="mt-4 flex items-start gap-2 rounded-xl bg-majlis-50 px-3 py-2.5 text-xs leading-snug text-majlis-800">
        <ShieldCheck className="mt-0.5 size-4 shrink-0" />
        {t('If a vendor declines, that service is refunded in full. This is a demo: no real payment is taken.', 'إذا رفض المورد الطلب يُسترد مبلغ الخدمة كاملاً. هذا عرض تجريبي ولا يتم أي دفع حقيقي.')}
      </p>
      <Button className="mt-4" variant="primary" size="lg" block disabled={paying || items.length === 0} onClick={pay} icon={paying ? <LoaderCircle className="size-4 animate-spin" /> : <CreditCard className="size-4" />}>
        {paying ? t('Processing…', 'جارٍ المعالجة…') : t(`Pay ${formatAED(total, 'en')} (demo)`, `ادفع ${formatAED(total, 'ar')} (تجريبي)`)}
      </Button>
    </Sheet>
  );
}

export function MyBookings({ requestId }: { requestId: string }) {
  const { t, L, lang } = useI18n();
  const { state } = useStore();
  const [reviewFor, setReviewFor] = useState<string | null>(null);
  const orders = state.orders.filter((o) => o.requestId === requestId);
  if (orders.length === 0) return null;
  const reviewed = new Set(state.reviews.filter((r) => r.author.startsWith(state.me.name.split(' ')[0])).map((r) => r.vendorId));

  return (
    <section>
      <SectionTitle eyebrow={t('Paid in the app', 'مدفوعة عبر التطبيق')} title={t('My bookings', 'حجوزاتي')} />
      <ul className="mt-3 space-y-2">
        {orders.map((o) => {
          const s = state.services.find((x) => x.id === o.serviceId)!;
          const v = state.vendors.find((x) => x.id === o.vendorId)!;
          const Icon = CATEGORY_ICON[s.category];
          const tone = o.status === 'completed' ? 'green' : o.status === 'confirmed' ? 'ink' : o.status === 'declined' ? 'red' : 'gold';
          return (
            <li key={o.id} className="flex items-center gap-3 rounded-2xl bg-white p-3.5 ring-1 ring-gypsum-200/70">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-majlis-50 text-majlis-700">
                <Icon className="size-[18px]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-majlis-950">{L(v.name)}</p>
                <p className="num text-xs text-gypsum-500">{formatAED(o.amount, lang)}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge tone={tone}>{L(ORDER_STATUS[o.status])}</Badge>
                {o.status === 'completed' && !reviewed.has(v.id) && (
                  <button className="text-xs font-semibold text-majlis-700 underline underline-offset-2" onClick={() => setReviewFor(v.id)}>
                    {t('Rate', 'قيّم')}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {orders.some((o) => o.status === 'awaiting_vendor') && (
        <a href="#/vendor" target="_blank" rel="noreferrer" className="mt-2 block text-xs text-dallah-700 underline underline-offset-2">
          {t('Demo: open the Vendor view to confirm these orders ↗', 'للعرض: افتح واجهة المورد لتأكيد هذه الطلبات ↗')}
        </a>
      )}
      <ReviewSheet vendorId={reviewFor} onClose={() => setReviewFor(null)} />
    </section>
  );
}

function ReviewSheet({ vendorId, onClose }: { vendorId: string | null; onClose: () => void }) {
  const { t, L } = useI18n();
  const { state, dispatch } = useStore();
  const toast = useToast();
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const v = state.vendors.find((x) => x.id === vendorId);
  return (
    <Sheet open={!!vendorId} onClose={onClose} title={v ? t(`Rate ${v.name.en}`, `قيّم ${v.name.ar}`) : ''}>
      {v && (
        <div className="space-y-4">
          <div className="flex justify-center gap-1.5" role="radiogroup" aria-label={t('Rating', 'التقييم')}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} role="radio" aria-checked={rating === n} onClick={() => setRating(n)} className="p-1 transition-transform active:scale-90">
                <Star className={cx('size-8', n <= rating ? 'fill-dallah-400 text-dallah-400' : 'text-gypsum-300')} />
              </button>
            ))}
          </div>
          <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={t('What went well? What could be better?', 'ما الذي أعجبك؟ وما الذي يمكن تحسينه؟')} />
          <Button
            block
            disabled={!text.trim()}
            onClick={() => {
              dispatch({ type: 'addReview', vendorId: v.id, rating, text, at: Date.now() });
              toast(t('Thanks. Your review helps other families.', 'شكراً، تقييمك يساعد العائلات الأخرى.'));
              setText('');
              onClose();
            }}
          >
            {t('Post review', 'انشر التقييم')}
          </Button>
          <p className="text-center text-xs text-gypsum-500">{L(v.name)}</p>
        </div>
      )}
    </Sheet>
  );
}
