import { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { formatAED, formatAEDCompact, formatNumber } from '../../domain/money';

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(640);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, e.contentRect.width)));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

function niceStep(max: number, ticks = 4) {
  const raw = max / ticks;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const n = raw / mag;
  return (n >= 5 ? 10 : n >= 2 ? 5 : n >= 1 ? 2 : 1) * mag;
}

/**
 * Revenue (commission per order × orders) against flat annual costs, on one AED axis.
 * Break-even is where the lines cross. Hover shows the numbers at any order volume.
 */
export function BreakEvenChart({ perOrder, fixedCost, orders, breakEven }: { perOrder: number; fixedCost: number; orders: number; breakEven: number }) {
  const { t, lang } = useI18n();
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const height = 280;
  const m = { top: 18, right: 18, bottom: 34, left: 64 };
  const iw = width - m.left - m.right;
  const ih = height - m.top - m.bottom;

  const finiteBE = Number.isFinite(breakEven) ? breakEven : orders * 2 || 1000;
  const xMaxRaw = Math.max(orders, finiteBE, 10) * 1.3;
  const xStep = niceStep(xMaxRaw);
  const xMax = Math.ceil(xMaxRaw / xStep) * xStep;
  const yMaxRaw = Math.max(perOrder * xMax, fixedCost) * 1.08;
  const yStep = niceStep(yMaxRaw);
  const yMax = Math.ceil(yMaxRaw / yStep) * yStep;
  const x = (v: number) => m.left + (v / xMax) * iw;
  const y = (v: number) => m.top + ih - (v / yMax) * ih;

  const xTicks = useMemo(() => Array.from({ length: Math.floor(xMax / xStep) + 1 }, (_, i) => i * xStep), [xMax, xStep]);
  const yTicks = useMemo(() => Array.from({ length: Math.floor(yMax / yStep) + 1 }, (_, i) => i * yStep), [yMax, yStep]);

  const beX = x(Math.min(finiteBE, xMax));
  const hv = hover ?? null;

  return (
    <div ref={ref} dir="ltr" className="relative w-full select-none">
      <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gypsum-700" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded-full bg-chart-revenue" />
          {t('Commission revenue', 'إيراد العمولة')}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded-full bg-chart-cost" />
          {t('Annual costs (hosting + operating)', 'التكاليف السنوية (الاستضافة والتشغيل)')}
        </span>
      </div>
      <svg
        width={width}
        height={height}
        role="img"
        aria-label={t(`Break-even at ${formatNumber(breakEven)} orders`, `نقطة التعادل عند ${formatNumber(breakEven)} طلب`)}
        onPointerMove={(e) => {
          const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const px = e.clientX - rect.left;
          if (px < m.left || px > m.left + iw) return setHover(null);
          setHover(Math.round(((px - m.left) / iw) * xMax));
        }}
        onPointerLeave={() => setHover(null)}
      >
        {/* grid */}
        {yTicks.map((v) => (
          <g key={v}>
            <line x1={m.left} x2={m.left + iw} y1={y(v)} y2={y(v)} stroke="var(--color-gypsum-200)" strokeWidth="1" />
            <text x={m.left - 8} y={y(v)} dy="0.32em" textAnchor="end" className="fill-gypsum-500 text-[10px]" style={{ fontFamily: 'var(--font-mono)' }}>
              {formatAEDCompact(v, 'en').replace('AED ', '')}
            </text>
          </g>
        ))}
        {xTicks.map((v) => (
          <text key={v} x={x(v)} y={m.top + ih + 18} textAnchor="middle" className="fill-gypsum-500 text-[10px]" style={{ fontFamily: 'var(--font-mono)' }}>
            {formatNumber(v)}
          </text>
        ))}
        <text x={m.left + iw} y={height - 2} textAnchor="end" className="fill-gypsum-400 text-[10px]">
          {t('completed paid service orders / year', 'طلبات الخدمات المدفوعة المكتملة / سنة')}
        </text>
        <text x={4} y={m.top - 6} className="fill-gypsum-400 text-[10px]">
          AED
        </text>

        {/* loss / profit zones */}
        <path d={`M${x(0)},${y(0)} L${beX},${y(Math.min(fixedCost, yMax))} L${beX},${y(fixedCost)} L${x(0)},${y(fixedCost)}Z`} fill="var(--color-chart-cost)" opacity="0.07" />
        {Number.isFinite(breakEven) && breakEven < xMax && (
          <path d={`M${beX},${y(fixedCost)} L${x(xMax)},${y(Math.min(perOrder * xMax, yMax))} L${x(xMax)},${y(fixedCost)}Z`} fill="var(--color-chart-revenue)" opacity="0.08" />
        )}

        {/* series */}
        <line x1={x(0)} x2={x(xMax)} y1={y(fixedCost)} y2={y(fixedCost)} stroke="var(--color-chart-cost)" strokeWidth="2" strokeLinecap="round" />
        <line x1={x(0)} x2={x(xMax)} y1={y(0)} y2={y(perOrder * xMax)} stroke="var(--color-chart-revenue)" strokeWidth="2" strokeLinecap="round" />

        {/* break-even */}
        {Number.isFinite(breakEven) && breakEven <= xMax && (
          <g>
            <line x1={beX} x2={beX} y1={m.top} y2={m.top + ih} stroke="var(--color-ink)" strokeDasharray="3 4" strokeWidth="1" opacity="0.45" />
            <circle cx={beX} cy={y(fixedCost)} r="5" fill="var(--color-ink)" stroke="white" strokeWidth="2" />
            <text x={beX + 8} y={m.top + 10} className="fill-ink text-[11px] font-semibold">
              {t('Break-even', 'نقطة التعادل')} · {formatNumber(breakEven)}
            </text>
          </g>
        )}

        {/* plan marker */}
        {orders > 0 && orders <= xMax && (
          <g>
            <line x1={x(orders)} x2={x(orders)} y1={y(perOrder * orders)} y2={m.top + ih} stroke="var(--color-chart-revenue)" strokeWidth="1" opacity="0.5" />
            <circle cx={x(orders)} cy={y(perOrder * orders)} r="5" fill="var(--color-chart-revenue)" stroke="white" strokeWidth="2" />
            <text x={x(orders) - 8} y={y(perOrder * orders) - 10} textAnchor="end" className="fill-gypsum-700 text-[11px] font-semibold">
              {t('Plan', 'الخطة')} · {formatNumber(orders)}
            </text>
          </g>
        )}

        {/* hover crosshair */}
        {hv !== null && (
          <g pointerEvents="none">
            <line x1={x(hv)} x2={x(hv)} y1={m.top} y2={m.top + ih} stroke="var(--color-gypsum-500)" strokeWidth="1" />
            <circle cx={x(hv)} cy={y(perOrder * hv)} r="4" fill="var(--color-chart-revenue)" stroke="white" strokeWidth="2" />
            <circle cx={x(hv)} cy={y(fixedCost)} r="4" fill="var(--color-chart-cost)" stroke="white" strokeWidth="2" />
          </g>
        )}
      </svg>
      {hv !== null && (
        <div
          className="pointer-events-none absolute top-8 z-10 w-52 rounded-xl bg-majlis-950 px-3 py-2.5 text-xs text-gypsum-50 shadow-lift"
          style={{ left: Math.min(Math.max(x(hv) + 12, 0), width - 212) }}
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
        >
          <p className="num mb-1.5 font-medium">
            {formatNumber(hv)} {t('orders', 'طلب')}
          </p>
          <p className="flex justify-between gap-2">
            <span className="text-majlis-200">{t('Revenue', 'الإيراد')}</span>
            <span className="num">{formatAED(Math.round(perOrder * hv), lang)}</span>
          </p>
          <p className="flex justify-between gap-2">
            <span className="text-majlis-200">{t('Costs', 'التكاليف')}</span>
            <span className="num">{formatAED(fixedCost, lang)}</span>
          </p>
          <p className="mt-1 flex justify-between gap-2 border-t border-white/10 pt-1 font-semibold">
            <span>{t('Net', 'الصافي')}</span>
            <span className="num">{formatAED(Math.round(perOrder * hv - fixedCost), lang)}</span>
          </p>
        </div>
      )}
    </div>
  );
}
