import { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { useI18n } from '../../i18n/I18nProvider';
import { useStore } from '../../store/StoreProvider';
import { generateIdeas, type Ideas } from '../../ai/features';
import { CATEGORY, OCCASION, SLR_THEME } from '../../i18n/labels';
import type { DateRequest } from '../../domain/types';
import { AiBadge } from '../../components/AiBadge';
import { Button, Chip, Input, Sheet } from '../../components/ui';

const MOODS = [
  { en: 'Heritage & Sadu', ar: 'تراثي وسدو' },
  { en: 'Modern minimal', ar: 'عصري بسيط' },
  { en: 'Garden evening', ar: 'أمسية في الحديقة' },
  { en: 'Intimate family', ar: 'عائلي هادئ' },
];

export function IdeasSheet({ open, onClose, request }: { open: boolean; onClose: () => void; request?: DateRequest }) {
  const { t, L, lang } = useI18n();
  const { state } = useStore();
  const [mood, setMood] = useState(MOODS[0].en);
  const [custom, setCustom] = useState('');
  const [ideas, setIdeas] = useState<Ideas | null>(null);
  const [source, setSource] = useState<'claude' | 'fallback'>();
  const [loading, setLoading] = useState(false);
  const majlis = request ? state.majlises.find((m) => m.id === request.majlisId) : undefined;

  const run = async () => {
    setLoading(true);
    const res = await generateIdeas({
      occasion: request ? OCCASION[request.occasion].en : 'wedding',
      guests: request?.guests ?? 200,
      majlis,
      vibe: custom.trim() || mood,
      lang,
      useAi: state.aiPrefs.enabled,
    });
    setIdeas(res.data);
    setSource(res.source);
    setLoading(false);
  };

  return (
    <Sheet open={open} onClose={onClose} title={t('Decor & evening ideas', 'أفكار الديكور والأمسية')} wide>
      <div className="space-y-4">
        <AiBadge source={source} theme={SLR_THEME.ideas} loading={loading} />
        <p className="text-sm text-gypsum-600">
          {majlis
            ? t(`For your ${OCCASION[request!.occasion].en.toLowerCase()} at ${majlis.name.en}, ${request!.guests} guests.`, `لـ${OCCASION[request!.occasion].ar} في ${majlis.name.ar}، ${request!.guests} ضيف.`)
            : t('Pick a mood. Ideas adapt once you have a majlis date.', 'اختر الطابع، وستتكيف الأفكار بعد تحديد موعد المجلس.')}
        </p>
        <div className="flex flex-wrap gap-2">
          {MOODS.map((m) => (
            <Chip key={m.en} active={!custom && mood === m.en} onClick={() => { setMood(m.en); setCustom(''); }}>
              {lang === 'ar' ? m.ar : m.en}
            </Chip>
          ))}
        </div>
        <Input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder={t('Or describe your own mood…', 'أو صف الطابع الذي تريده…')} />
        <Button block onClick={run} disabled={loading} icon={<Sparkles className="size-4" />}>
          {loading ? t('Designing…', 'جارٍ التصميم…') : ideas ? t('Generate again', 'أعد التوليد') : t('Generate ideas', 'ولّد الأفكار')}
        </Button>

        {loading && !ideas && (
          <div className="space-y-2">
            <div className="skeleton h-6 w-2/3" />
            <div className="skeleton h-16 w-full" />
            <div className="skeleton h-24 w-full" />
          </div>
        )}

        {ideas && (
          <motion.div key={ideas.title} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 rounded-2xl bg-white p-4 ring-1 ring-gypsum-200">
            <div>
              <h4 className="display text-xl font-semibold text-majlis-900">{ideas.title}</h4>
              <p className="mt-1 text-sm leading-relaxed text-gypsum-700">{ideas.summary}</p>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {ideas.palette.map((p) => (
                <div key={p.hex + p.name}>
                  <div className="arch h-16 ring-1 ring-black/5 [--arch-base:8px] [--arch-rise:40%]" style={{ background: p.hex }} />
                  <p className="mt-1 truncate text-[0.6875rem] font-semibold text-gypsum-700">{p.name}</p>
                  <p className="num text-[0.625rem] uppercase text-gypsum-400">{p.hex}</p>
                </div>
              ))}
            </div>
            <div>
              <p className="eyebrow mb-1.5 text-dallah-600">{t('Setup', 'التجهيزات')}</p>
              <ul className="space-y-1 text-sm text-gypsum-700">
                {ideas.setup.map((s, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-2 size-1.5 shrink-0 rotate-45 bg-dallah-500" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="eyebrow mb-1.5 text-dallah-600">{t('Run of the evening', 'برنامج الأمسية')}</p>
              <ol className="space-y-1.5">
                {ideas.timeline.map((s, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="num w-12 shrink-0 text-majlis-700">{s.time}</span>
                    <span className="text-gypsum-700">{s.item}</span>
                  </li>
                ))}
              </ol>
            </div>
            {ideas.services.length > 0 && (
              <p className="text-xs text-gypsum-500">
                {t('Services this needs:', 'الخدمات المطلوبة:')} {ideas.services.map((c) => L(CATEGORY[c])).join(' · ')}
              </p>
            )}
          </motion.div>
        )}
      </div>
    </Sheet>
  );
}
