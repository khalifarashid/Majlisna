import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Info, RotateCcw } from 'lucide-react';
import { useI18n } from '../../i18n/I18nProvider';
import { useStore } from '../../store/StoreProvider';
import { BALANCE_SHEET, BASE_2026, BASE_2027, FULL_YEAR_ORDERS_PER_MAJLIS, runForecast, type ForecastInputs } from '../../domain/forecast';
import { formatAED, formatNumber } from '../../domain/money';
import { Card, Segmented, Stat, cx } from '../../components/ui';
import { BreakEvenChart } from './BreakEvenChart';

function Slider({ label, value, min, max, step, onChange, format }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; format: (v: number) => string }) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-3 text-[0.8125rem]">
        <span className="font-semibold text-gypsum-700">{label}</span>
        <span className="num text-majlis-900">{format(value)}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-2 w-full" />
    </label>
  );
}

export function BusinessDashboard() {
  const { t, lang } = useI18n();
  const { state } = useStore();
  const [year, setYear] = useState<'2026' | '2027'>('2027');
  const base = year === '2026' ? BASE_2026 : BASE_2027;
  const [inputs, setInputs] = useState<ForecastInputs>(BASE_2027);
  const setYearAndBase = (y: '2026' | '2027') => {
    setYear(y);
    setInputs(y === '2026' ? BASE_2026 : BASE_2027);
  };
  const r = useMemo(() => runForecast(inputs), [inputs]);
  const fixed = r.opexTotal + inputs.hosting;
  const changed = JSON.stringify(inputs) !== JSON.stringify(base);
  const gap = r.orders - r.breakEvenOrders;

  // Live numbers from the running demo
  const completed = state.orders.filter((o) => o.status === 'completed');
  const pipeline = state.orders.filter((o) => o.status === 'awaiting_vendor' || o.status === 'confirmed');
  const gmv = completed.reduce((s, o) => s + o.amount, 0);
  const commission = completed.reduce((s, o) => s + o.fee, 0);
  const pipelineFee = pipeline.reduce((s, o) => s + o.fee, 0);
  const approved = state.requests.filter((q) => q.status === 'approved');
  const withOrders = approved.filter((q) => state.orders.some((o) => o.requestId === q.id)).length;

  const IS_ROWS: { label: [string, string]; v: (y: 2026 | 2027) => number; strong?: boolean; muted?: boolean; indent?: boolean }[] = [
    { label: ['Majlisna commission revenue (8%)', 'إيراد عمولة مجلسنا (٨٪)'], v: (y) => runForecast(y === 2026 ? BASE_2026 : BASE_2027).revenue, strong: true },
    { label: ['Gross vendor bookings (not revenue)', 'إجمالي حجوزات الموردين (ليست إيراداً)'], v: (y) => runForecast(y === 2026 ? BASE_2026 : BASE_2027).gross, muted: true },
    { label: ['Cloud hosting', 'الاستضافة السحابية'], v: (y) => (y === 2026 ? BASE_2026 : BASE_2027).hosting, indent: true },
    { label: ['Gross profit', 'إجمالي الربح'], v: (y) => runForecast(y === 2026 ? BASE_2026 : BASE_2027).grossProfit, strong: true },
    { label: ['Wages and employer costs', 'الرواتب وتكاليف التوظيف'], v: (y) => (y === 2026 ? BASE_2026 : BASE_2027).opex.wages, indent: true },
    { label: ['Phone / internet', 'الهاتف والإنترنت'], v: (y) => (y === 2026 ? BASE_2026 : BASE_2027).opex.utilities, indent: true },
    { label: ['Routine maintenance', 'الصيانة الدورية'], v: (y) => (y === 2026 ? BASE_2026 : BASE_2027).opex.maintenance, indent: true },
    { label: ['Software development', 'تطوير البرمجيات'], v: (y) => (y === 2026 ? BASE_2026 : BASE_2027).opex.development, indent: true },
    { label: ['Security and cybersecurity', 'الأمن السيبراني'], v: (y) => (y === 2026 ? BASE_2026 : BASE_2027).opex.security, indent: true },
    { label: ['Professional and legal fees', 'الرسوم المهنية والقانونية'], v: (y) => (y === 2026 ? BASE_2026 : BASE_2027).opex.professional, indent: true },
    { label: ['Total operating expenses', 'إجمالي المصروفات التشغيلية'], v: (y) => runForecast(y === 2026 ? BASE_2026 : BASE_2027).opexTotal, strong: true },
    { label: ['Net income (loss)', 'صافي الدخل (الخسارة)'], v: (y) => runForecast(y === 2026 ? BASE_2026 : BASE_2027).net, strong: true },
  ];

  const BS_ROWS: { label: [string, string]; k: keyof (typeof BALANCE_SHEET)[2026]; strong?: boolean }[] = [
    { label: ['Cash', 'النقد'], k: 'cash' },
    { label: ['Accounts receivable (7-day settlement)', 'الذمم المدينة (تسوية ٧ أيام)'], k: 'receivables' },
    { label: ['Prepaid expenses', 'مصروفات مدفوعة مقدماً'], k: 'prepaid' },
    { label: ['Total assets', 'إجمالي الأصول'], k: 'totalAssets', strong: true },
    { label: ['Current liabilities', 'الالتزامات المتداولة'], k: 'currentLiabilities' },
    { label: ['Proposed Khalifa Fund loan (not approved)', 'قرض صندوق خليفة المقترح (غير معتمد)'], k: 'loan' },
    { label: ['Founders’ capital', 'رأس مال المؤسسين'], k: 'founders' },
    { label: ['Retained earnings', 'الأرباح المحتجزة'], k: 'retained' },
    { label: ['Total liabilities and equity', 'إجمالي الالتزامات وحقوق الملكية'], k: 'totalLiabEquity', strong: true },
  ];

  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-10 pt-6 sm:px-6">
      <div>
        <p className="eyebrow text-dallah-600">{t('Business model · IBS485 venture plan', 'نموذج العمل · خطة مشروع IBS485')}</p>
        <h1 className="display mt-1 text-3xl font-semibold text-majlis-900">{t('The numbers behind Majlisna', 'الأرقام وراء مجلسنا')}</h1>
        <p className="mt-1 max-w-2xl text-sm text-gypsum-600">
          {t('Live figures come from activity in this demo. The forecast reproduces the team’s pro forma workbook and lets you test the assumptions.', 'الأرقام المباشرة من نشاط هذا العرض، والتوقعات تعيد إنتاج ملف القوائم المالية للفريق وتتيح اختبار الافتراضات.')}
        </p>
      </div>

      {/* Live */}
      <section className="mt-6">
        <div className="mb-2 flex items-center gap-2">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-majlis-400 opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-majlis-500" />
          </span>
          <p className="text-sm font-semibold text-majlis-900">{t('Live from the demo', 'مباشر من العرض')}</p>
        </div>
        <Card className="grid grid-cols-2 gap-5 p-5 md:grid-cols-3 xl:grid-cols-6">
          <Stat label={t('Completed services', 'خدمات مكتملة')} value={completed.length} />
          <Stat label={t('Gross bookings', 'إجمالي الحجوزات')} value={formatAED(gmv, lang)} sub={t('Paid to vendors, not revenue', 'تُدفع للموردين وليست إيراداً')} />
          <Stat label={t('Majlisna commission', 'عمولة مجلسنا')} value={formatAED(commission, lang)} tone="green" sub={t('8% of completed', '٨٪ من المكتمل')} />
          <Stat label={t('In the pipeline', 'قيد التنفيذ')} value={formatAED(pipelineFee, lang)} sub={t(`${pipeline.length} open orders`, `${pipeline.length} طلبات مفتوحة`)} />
          <Stat label={t('Approved dates', 'مواعيد معتمدة')} value={approved.length} sub={t(`${withOrders} booked services`, `${withOrders} حجزت خدمات`)} />
          <Stat label={t('Verified vendors', 'موردون موثقون')} value={`${state.vendors.filter((v) => v.verified).length}/${state.vendors.length}`} />
        </Card>
      </section>

      {/* Forecast */}
      <section className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <Card className="space-y-5 p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="font-semibold text-majlis-950">{t('Forecast model', 'نموذج التوقعات')}</p>
            <Segmented
              size="sm"
              value={year}
              onChange={setYearAndBase}
              options={[
                { value: '2026', label: t('2026 pilot', 'تجربة ٢٠٢٦') },
                { value: '2027', label: t('2027 rollout', 'توسع ٢٠٢٧') },
              ]}
            />
          </div>
          <Slider label={t('Government majlises', 'المجالس الحكومية')} value={inputs.majlises} min={1} max={40} step={1} onChange={(v) => setInputs({ ...inputs, majlises: v })} format={(v) => String(v)} />
          <Slider
            label={t('Paid services per majlis / year', 'الخدمات المدفوعة لكل مجلس / سنة')}
            value={inputs.ordersPerMajlis}
            min={0}
            max={FULL_YEAR_ORDERS_PER_MAJLIS}
            step={6}
            onChange={(v) => setInputs({ ...inputs, ordersPerMajlis: v })}
            format={(v) => formatNumber(v)}
          />
          <Slider label={t('Average service price', 'متوسط سعر الخدمة')} value={inputs.avgPrice} min={1000} max={5000} step={50} onChange={(v) => setInputs({ ...inputs, avgPrice: v })} format={(v) => formatAED(v, lang)} />
          <Slider label={t('Commission rate', 'نسبة العمولة')} value={inputs.rate} min={0.04} max={0.12} step={0.005} onChange={(v) => setInputs({ ...inputs, rate: v })} format={(v) => `${(v * 100).toFixed(1)}%`} />
          <div className="flex items-start gap-2 rounded-xl bg-gypsum-100 p-3 text-xs leading-snug text-gypsum-600">
            <Info className="mt-0.5 size-3.5 shrink-0" />
            <span>
              {t(
                `Costs stay at the ${year} plan (${formatAED(fixed, 'en')}). The workbook’s full-year scenario is ${FULL_YEAR_ORDERS_PER_MAJLIS} services per majlis (3 weddings × 4 services × 52 weeks); the base case uses 150 to allow for a gradual rollout.`,
                `تبقى التكاليف عند خطة ${year} (${formatAED(fixed, 'ar')}). سيناريو السنة الكاملة في الملف هو ${FULL_YEAR_ORDERS_PER_MAJLIS} خدمة لكل مجلس (٣ أعراس × ٤ خدمات × ٥٢ أسبوعاً)، والحالة الأساسية تستخدم ١٥٠ لمراعاة التوسع التدريجي.`,
              )}
            </span>
          </div>
          {changed && (
            <button onClick={() => setInputs(base)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-majlis-700">
              <RotateCcw className="size-3.5" /> {t('Back to the plan', 'العودة إلى الخطة')}
            </button>
          )}
        </Card>

        <Card className="p-5">
          <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
            <Stat label={t('Commission revenue', 'إيراد العمولة')} value={formatAED(r.revenue, lang)} sub={t(`${formatNumber(r.orders)} orders`, `${formatNumber(r.orders)} طلب`)} />
            <Stat label={t('Annual costs', 'التكاليف السنوية')} value={formatAED(fixed, lang)} />
            <Stat label={t('Net income', 'صافي الدخل')} value={formatAED(r.net, lang)} tone={r.net >= 0 ? 'green' : 'red'} />
            <Stat
              label={t('Break-even orders', 'طلبات التعادل')}
              value={Number.isFinite(r.breakEvenOrders) ? formatNumber(r.breakEvenOrders) : '–'}
              sub={
                Number.isFinite(r.breakEvenOrders)
                  ? gap >= 0
                    ? t(`${formatNumber(gap)} above`, `أعلى بـ${formatNumber(gap)}`)
                    : t(`${formatNumber(-gap)} short`, `ينقص ${formatNumber(-gap)}`)
                  : undefined
              }
              tone={gap >= 0 ? 'green' : 'red'}
            />
          </div>
          <div className="mt-6">
            <BreakEvenChart perOrder={r.perOrderCommission} fixedCost={fixed} orders={r.orders} breakEven={r.breakEvenOrders} />
          </div>
          <p className="mt-2 text-xs text-gypsum-500">
            {t(`Each completed service earns Majlisna ${formatAED(r.perOrderCommission, 'en')} (${(inputs.rate * 100).toFixed(1)}% of ${formatAED(inputs.avgPrice, 'en')}).`, `كل خدمة مكتملة تحقق لمجلسنا ${formatAED(r.perOrderCommission, 'ar')} (${(inputs.rate * 100).toFixed(1)}٪ من ${formatAED(inputs.avgPrice, 'ar')}).`)}
          </p>
        </Card>
      </section>

      {/* Pro forma */}
      <section className="mt-8 grid gap-5 xl:grid-cols-2">
        <Card className="overflow-hidden">
          <div className="border-b border-gypsum-200 px-5 py-4">
            <p className="font-semibold text-majlis-950">{t('Pro forma income statement', 'قائمة الدخل التقديرية')}</p>
            <p className="text-xs text-gypsum-500">{t('Estimates, not results. 1 majlis in 2026; up to 20 in 2027.', 'تقديرات وليست نتائج. مجلس واحد في ٢٠٢٦ وحتى ٢٠ في ٢٠٢٧.')}</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gypsum-500">
                <th className="px-5 py-2 text-start font-medium">AED</th>
                <th className="px-5 py-2 text-end font-medium">2026</th>
                <th className="px-5 py-2 text-end font-medium">2027</th>
              </tr>
            </thead>
            <tbody>
              {IS_ROWS.map((row, i) => (
                <motion.tr key={i} className={cx('border-t border-gypsum-100', row.strong && 'bg-gypsum-50 font-semibold')}>
                  <td className={cx('px-5 py-2', row.indent && 'ps-9 text-gypsum-700', row.muted && 'italic text-gypsum-500')}>{lang === 'ar' ? row.label[1] : row.label[0]}</td>
                  {([2026, 2027] as const).map((y) => {
                    const v = row.v(y);
                    return (
                      <td key={y} className={cx('num px-5 py-2 text-end', v < 0 && 'text-sadu-600', row.muted && 'text-gypsum-500')}>
                        {formatAED(v, 'en').replace('AED ', '')}
                      </td>
                    );
                  })}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b border-gypsum-200 px-5 py-4">
            <p className="font-semibold text-majlis-950">{t('Pro forma balance sheet', 'الميزانية العمومية التقديرية')}</p>
            <p className="text-xs text-gypsum-500">{t('Simplified. Loan interest and repayments excluded until terms are known.', 'مبسطة. فوائد القرض وسداده مستبعدة حتى تُعرف الشروط.')}</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gypsum-500">
                <th className="px-5 py-2 text-start font-medium">AED</th>
                <th className="px-5 py-2 text-end font-medium">2026</th>
                <th className="px-5 py-2 text-end font-medium">2027</th>
              </tr>
            </thead>
            <tbody>
              {BS_ROWS.map((row) => (
                <tr key={row.k} className={cx('border-t border-gypsum-100', row.strong && 'bg-gypsum-50 font-semibold')}>
                  <td className="px-5 py-2">{lang === 'ar' ? row.label[1] : row.label[0]}</td>
                  {([2026, 2027] as const).map((y) => {
                    const v = BALANCE_SHEET[y][row.k];
                    const text = Number.isInteger(v) ? formatAED(v, 'en').replace('AED ', '') : Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    return (
                      <td key={y} className={cx('num px-5 py-2 text-end', v < 0 && 'text-sadu-600')}>
                        {text}
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr className="border-t border-gypsum-200">
                <td className="px-5 py-2 text-xs text-gypsum-500">{t('Balance check', 'التحقق من التوازن')}</td>
                <td className="num px-5 py-2 text-end text-xs text-majlis-600">0 ✓</td>
                <td className="num px-5 py-2 text-end text-xs text-majlis-600">0 ✓</td>
              </tr>
            </tbody>
          </table>
        </Card>
      </section>

      <Card className="mt-5 p-5">
        <p className="font-semibold text-majlis-950">{t('Conditions behind these numbers', 'شروط هذه الأرقام')}</p>
        <ul className="mt-3 grid gap-2 text-[0.8125rem] leading-snug text-gypsum-700 md:grid-cols-2">
          {[
            ['Government approval and a pilot majlis are not yet confirmed.', 'لم تُعتمد بعد الموافقة الحكومية ولا المجلس التجريبي.'],
            ['The AED 150,000 Khalifa Fund loan is proposed, not approved. Founders invest AED 0.', 'قرض صندوق خليفة بقيمة ١٥٠٬٠٠٠ د.إ مقترح وغير معتمد، والمؤسسون يستثمرون ٠ د.إ.'],
            ['Vendors cover payment-processing fees under the payment-provider agreement.', 'يتحمل الموردون رسوم معالجة الدفع وفق اتفاقية مزود الدفع.'],
            ['2027 commission (AED 543,000) is above the AED 375,000 VAT threshold: VAT registration needs review.', 'عمولة ٢٠٢٧ (٥٤٣٬٠٠٠ د.إ) تتجاوز حد التسجيل في ضريبة القيمة المضافة (٣٧٥٬٠٠٠ د.إ)، ويلزم مراجعة التسجيل.'],
            ['2027 profit (AED 105,200) is below the AED 375,000 corporate-tax threshold.', 'ربح ٢٠٢٧ (١٠٥٬٢٠٠ د.إ) أقل من حد ضريبة الشركات (٣٧٥٬٠٠٠ د.إ).'],
            ['No paid advertising: promotion through official channels only if a partnership is approved.', 'لا إعلانات مدفوعة: الترويج عبر القنوات الرسمية فقط عند اعتماد الشراكة.'],
          ].map(([en, ar]) => (
            <li key={en} className="flex gap-2">
              <span className="mt-1.5 size-1.5 shrink-0 rotate-45 bg-dallah-500" />
              {lang === 'ar' ? ar : en}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
