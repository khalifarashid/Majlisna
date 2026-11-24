import { useState } from 'react';
import { Link } from 'react-router';
import { Lock, MessageSquareText, Send, Settings, Sparkles } from 'lucide-react';
import { useI18n } from '../../i18n/I18nProvider';
import { useStore } from '../../store/StoreProvider';
import { INTEREST, ISSUE_CATEGORY } from '../../i18n/labels';
import type { Interest, IssueCategory } from '../../domain/types';
import { formatRelative } from '../../domain/dates';
import { Badge, Button, Card, Chip, Field, Select, Textarea, cx } from '../../components/ui';
import { useToast } from '../../components/Toasts';

function Toggle({ on, onChange, label, sub }: { on: boolean; onChange: (v: boolean) => void; label: string; sub: string }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 py-3">
      <span>
        <span className="block text-sm font-semibold text-majlis-950">{label}</span>
        <span className="block text-xs leading-snug text-gypsum-600">{sub}</span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => onChange(!on)}
        className={cx('relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors', on ? 'bg-majlis-700' : 'bg-gypsum-300')}
      >
        <span className={cx('absolute top-0.5 size-5 rounded-full bg-white shadow transition-[inset-inline-start] duration-200', on ? 'start-[1.375rem]' : 'start-0.5')} />
      </button>
    </label>
  );
}

export function Profile() {
  const { t, L, lang } = useI18n();
  const { state, dispatch } = useStore();
  const toast = useToast();
  const [majlisId, setMajlisId] = useState(state.majlises[0].id);
  const [category, setCategory] = useState<IssueCategory>('facility');
  const [text, setText] = useState('');

  const toggleInterest = (i: Interest) =>
    dispatch({ type: 'setInterests', interests: state.interests.includes(i) ? state.interests.filter((x) => x !== i) : [...state.interests, i] });

  return (
    <div className="space-y-5 px-4 pb-6 pt-4">
      <div className="flex items-center gap-3">
        <div className="arch grid h-16 w-14 place-items-center bg-majlis-800 text-xl font-semibold text-dallah-300 [--arch-base:10px] [--arch-rise:44%]">
          <span className="display">{lang === 'ar' ? 'ح' : 'H'}</span>
        </div>
        <div>
          <h1 className="display text-xl font-semibold text-majlis-900">{lang === 'ar' ? 'حمد السويدي' : state.me.name}</h1>
          <p className="text-xs text-gypsum-600">{t('Resident · Khalifa City', 'مواطن · مدينة خليفة')}</p>
        </div>
      </div>

      <Card className="p-4">
        <p className="text-sm font-semibold text-majlis-950">{t('My interests', 'اهتماماتي')}</p>
        <p className="mb-3 text-xs text-gypsum-600">{t('Used to pick events for you. Change them any time.', 'تُستخدم لاختيار الفعاليات لك، ويمكنك تغييرها في أي وقت.')}</p>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(INTEREST) as Interest[]).map((i) => (
            <Chip key={i} active={state.interests.includes(i)} onClick={() => toggleInterest(i)}>
              {L(INTEREST[i])}
            </Chip>
          ))}
        </div>
      </Card>

      <Card className="divide-y divide-gypsum-200 px-4 py-1">
        <div className="flex items-center gap-2 pb-1 pt-3">
          <Lock className="size-4 text-majlis-600" />
          <p className="text-sm font-semibold text-majlis-950">{t('AI & privacy', 'الذكاء الاصطناعي والخصوصية')}</p>
        </div>
        <Toggle
          on={state.aiPrefs.enabled}
          onChange={(v) => dispatch({ type: 'setAiPrefs', prefs: { enabled: v } })}
          label={t('AI features', 'ميزات الذكاء الاصطناعي')}
          sub={t('Picks, assistant and ideas. When off, simple rules are used instead.', 'الترشيحات والمساعد والأفكار. عند الإيقاف تُستخدم قواعد بسيطة.')}
        />
        <Toggle
          on={state.aiPrefs.personalise}
          onChange={(v) => dispatch({ type: 'setAiPrefs', prefs: { personalise: v } })}
          label={t('Use my interests', 'استخدم اهتماماتي')}
          sub={t('Off: you see popular events, and your interests are never sent to the AI.', 'عند الإيقاف: تظهر الفعاليات الشائعة ولا تُرسل اهتماماتك إلى الذكاء الاصطناعي.')}
        />
        <p className="flex items-start gap-2 py-3 text-xs leading-snug text-gypsum-600">
          <Sparkles className="mt-0.5 size-3.5 shrink-0 text-dallah-600" />
          {t('AI never approves dates or makes decisions. The majlis team decides every request.', 'لا يعتمد الذكاء الاصطناعي المواعيد ولا يتخذ القرارات، ففريق المجلس يقرر في كل طلب.')}
        </p>
      </Card>

      <Card className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <MessageSquareText className="size-4 text-majlis-600" />
          <p className="text-sm font-semibold text-majlis-950">{t('Report a community issue', 'الإبلاغ عن مشكلة مجتمعية')}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('Majlis', 'المجلس')}>
            <Select value={majlisId} onChange={(e) => setMajlisId(e.target.value)}>
              {state.majlises.map((m) => (
                <option key={m.id} value={m.id}>
                  {L(m.name)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t('Type', 'النوع')}>
            <Select value={category} onChange={(e) => setCategory(e.target.value as IssueCategory)}>
              {(Object.keys(ISSUE_CATEGORY) as IssueCategory[]).map((c) => (
                <option key={c} value={c}>
                  {L(ISSUE_CATEGORY[c])}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Textarea className="mt-3" value={text} onChange={(e) => setText(e.target.value)} placeholder={t('What happened, and where?', 'ماذا حدث وأين؟')} maxLength={400} />
        <Button
          className="mt-3"
          block
          variant="ghost"
          disabled={!text.trim()}
          icon={<Send className="flip-rtl size-4" />}
          onClick={() => {
            if (dispatch({ type: 'reportIssue', majlisId, category, text, at: Date.now() })) {
              setText('');
              toast(t('Report sent to the majlis team.', 'تم إرسال البلاغ إلى فريق المجلس.'));
            }
          }}
        >
          {t('Send report', 'أرسل البلاغ')}
        </Button>
        {state.issues.length > 0 && (
          <ul className="mt-4 space-y-2">
            {state.issues.slice(0, 4).map((i) => (
              <li key={i.id} className="flex items-start justify-between gap-3 text-xs">
                <span className="text-gypsum-700">
                  {i.text}
                  <span className="block text-gypsum-400">{formatRelative(i.createdAt, lang)}</span>
                </span>
                <Badge tone={i.status === 'resolved' ? 'green' : i.status === 'in_review' ? 'gold' : 'grey'}>
                  {i.status === 'resolved' ? t('Resolved', 'تم الحل') : i.status === 'in_review' ? t('In review', 'قيد المراجعة') : t('Received', 'مستلم')}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Link to="/settings" className="flex items-center justify-center gap-2 py-2 text-sm font-semibold text-majlis-700">
        <Settings className="size-4" /> {t('Settings, Claude key & reset demo', 'الإعدادات ومفتاح Claude وإعادة الضبط')}
      </Link>
    </div>
  );
}
