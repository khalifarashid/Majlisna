import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Send, Square } from 'lucide-react';
import { useI18n } from '../../i18n/I18nProvider';
import { useStore } from '../../store/StoreProvider';
import { myActiveRequest } from '../../store/reducer';
import { askAssistant, type ChatTurn } from '../../ai/features';
import { todayISO } from '../../domain/dates';
import { SLR_THEME } from '../../i18n/labels';
import { AiBadge } from '../../components/AiBadge';
import { LogoMark } from '../../components/Logo';
import { cx } from '../../components/ui';

const SUGGESTIONS = [
  { en: 'What’s on this week?', ar: 'ما فعاليات هذا الأسبوع؟' },
  { en: 'How do I request a wedding date?', ar: 'كيف أطلب موعداً للعرس؟' },
  { en: 'How much do services cost?', ar: 'كم أسعار الخدمات؟' },
  { en: 'Which majlis fits 350 guests?', ar: 'أي مجلس يتسع لـ٣٥٠ ضيفاً؟' },
];

export function Assistant() {
  const { t, lang } = useI18n();
  const { state } = useStore();
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [source, setSource] = useState<'claude' | 'fallback'>();
  const abort = useRef<AbortController | null>(null);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [turns]);
  useEffect(() => () => abort.current?.abort(), []);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    setDraft('');
    const history: ChatTurn[] = [...turns, { role: 'user', text: q }];
    setTurns([...history, { role: 'assistant', text: '' }]);
    setBusy(true);
    abort.current = new AbortController();
    const res = await askAssistant(
      { lang, today: todayISO(), majlises: state.majlises, events: state.events, vendors: state.vendors, services: state.services, myRequest: myActiveRequest(state) },
      history,
      (partial) => setTurns([...history, { role: 'assistant', text: partial }]),
      state.aiPrefs.enabled,
      abort.current.signal,
    );
    setTurns([...history, { role: 'assistant', text: res.data }]);
    setSource(res.source);
    setBusy(false);
  };

  return (
    <div className="flex min-h-[calc(100dvh-12rem)] flex-col px-4 pt-4 sm:min-h-[calc(100%-1rem)]">
      <div className="mb-3">
        <h1 className="display text-[1.6rem] font-semibold text-majlis-900">{t('Ask Majlisna', 'اسأل مجلسنا')}</h1>
        <AiBadge className="mt-1" source={source} theme={SLR_THEME.assistant} loading={busy && !turns.at(-1)?.text} />
      </div>

      <div className="flex-1 space-y-3 pb-4" aria-live="polite">
        {turns.length === 0 && (
          <div className="flex flex-col items-center pt-6 text-center">
            <div className="arch grid h-24 w-20 place-items-center bg-majlis-800 [--arch-base:12px] [--arch-rise:44%]">
              <LogoMark className="h-10 w-auto" mono />
            </div>
            <p className="mt-4 max-w-[16rem] text-sm text-gypsum-600">
              {t('Ask about majlises, events, services or your request. Arabic or English.', 'اسأل عن المجالس أو الفعاليات أو الخدمات أو طلبك، بالعربية أو الإنجليزية.')}
            </p>
            <div className="mt-5 flex w-full flex-col gap-2">
              {SUGGESTIONS.map((s) => (
                <button key={s.en} onClick={() => void send(lang === 'ar' ? s.ar : s.en)} className="rounded-xl bg-white px-4 py-2.5 text-start text-sm text-majlis-800 ring-1 ring-gypsum-200 transition-colors hover:bg-majlis-50">
                  {lang === 'ar' ? s.ar : s.en}
                </button>
              ))}
            </div>
          </div>
        )}
        <AnimatePresence initial={false}>
          {turns.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={cx('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              <div
                dir="auto"
                className={cx(
                  'max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[0.9rem] leading-relaxed',
                  m.role === 'user' ? 'rounded-ee-md bg-majlis-800 text-gypsum-50' : 'rounded-es-md bg-white text-ink ring-1 ring-gypsum-200',
                )}
              >
                {m.text || (
                  <span className="inline-flex gap-1 py-1">
                    {[0, 1, 2].map((d) => (
                      <span key={d} className="size-1.5 animate-bounce rounded-full bg-gypsum-400" style={{ animationDelay: `${d * 120}ms` }} />
                    ))}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={end} />
      </div>

      <form
        className="sticky bottom-24 flex items-center gap-2 rounded-2xl bg-white p-1.5 shadow-lift ring-1 ring-gypsum-200"
        onSubmit={(e) => {
          e.preventDefault();
          void send(draft);
        }}
      >
        <input
          dir="auto"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t('Type a question…', 'اكتب سؤالك…')}
          className="h-10 min-w-0 flex-1 bg-transparent px-3 text-[0.9375rem] outline-none placeholder:text-gypsum-400"
          aria-label={t('Your question', 'سؤالك')}
        />
        {busy ? (
          <button type="button" onClick={() => abort.current?.abort()} className="grid size-10 place-items-center rounded-xl bg-gypsum-200 text-majlis-900" aria-label={t('Stop', 'إيقاف')}>
            <Square className="size-3.5 fill-current" />
          </button>
        ) : (
          <button type="submit" disabled={!draft.trim()} className="grid size-10 place-items-center rounded-xl bg-majlis-800 text-gypsum-50 transition-opacity disabled:opacity-35" aria-label={t('Send', 'إرسال')}>
            <Send className="flip-rtl size-4" />
          </button>
        )}
      </form>
    </div>
  );
}
