import { useState } from 'react';
import { Eye, EyeOff, KeyRound, LoaderCircle, RotateCcw, ShieldCheck, Trash } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import { useStore } from '../store/StoreProvider';
import { getAiKey, MODEL, setAiKey } from '../ai/key';
import { useAiKey } from '../ai/useAiKey';
import { todayISO } from '../domain/dates';
import { Badge, Button, Card, Input, Segmented } from '../components/ui';
import { useToast } from '../components/Toasts';

export function SettingsPage() {
  const { t, lang, setLang } = useI18n();
  const { dispatch } = useStore();
  const toast = useToast();
  const has = useAiKey();
  const [key, setKey] = useState('');
  const [show, setShow] = useState(false);
  const [testing, setTesting] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const saved = getAiKey();

  const save = async () => {
    setAiKey(key);
    setKey('');
    setTesting(true);
    try {
      const { testKey } = await import('../ai/client');
      await testKey();
      toast(t('Claude is on. AI features now use your key.', 'تم تفعيل Claude، وتستخدم ميزات الذكاء الاصطناعي مفتاحك الآن.'));
    } catch (e) {
      const code = (e as { code?: string }).code;
      toast(
        code === 'bad_key'
          ? t('That key was rejected. Check it in the Claude Console and paste it again.', 'تم رفض المفتاح. تحقق منه في منصة Claude والصقه مجدداً.')
          : code === 'network'
            ? t('Could not reach Claude. Check your connection; the key is saved.', 'تعذّر الاتصال بـ Claude. تحقق من الاتصال؛ تم حفظ المفتاح.')
            : t('Key saved, but the test call failed. AI features will fall back to scripted replies if it keeps failing.', 'تم حفظ المفتاح لكن فشل الاختبار. ستعود الميزات للردود المبرمجة إذا استمر الفشل.'),
        'error',
      );
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 pb-10 pt-6 sm:px-6">
      <div>
        <p className="eyebrow text-dallah-600">{t('Settings', 'الإعدادات')}</p>
        <h1 className="display mt-1 text-3xl font-semibold text-majlis-900">{t('Make the demo yours', 'خصّص العرض')}</h1>
      </div>

      <Card className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <KeyRound className="size-5 text-dallah-600" />
            <p className="font-semibold text-majlis-950">{t('Claude AI', 'ذكاء Claude')}</p>
          </div>
          <Badge tone={has ? 'green' : 'grey'}>{has ? t('On', 'مفعّل') : t('Scripted replies', 'ردود مبرمجة')}</Badge>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-gypsum-600">
          {t(
            'This site has no server, so real AI needs your own Anthropic API key. It is stored only in this browser and sent only to api.anthropic.com. Without a key, every AI feature still works with scripted answers.',
            'لا يوجد خادم لهذا الموقع، لذا يحتاج الذكاء الاصطناعي الحقيقي إلى مفتاح Anthropic API خاص بك. يُحفظ في هذا المتصفح فقط ويُرسل إلى api.anthropic.com فقط. بدون مفتاح تعمل كل الميزات بردود مبرمجة.',
          )}
        </p>
        {saved ? (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-gypsum-100 p-3">
            <span className="num flex-1 text-sm text-gypsum-700">{saved.slice(0, 10)}••••••••{saved.slice(-4)}</span>
            <Button size="sm" variant="danger" icon={<Trash className="size-3.5" />} onClick={() => setAiKey(null)}>
              {t('Remove key', 'إزالة المفتاح')}
            </Button>
          </div>
        ) : (
          <form
            className="mt-4 flex flex-col gap-2 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              if (key.trim()) void save();
            }}
          >
            <div className="relative flex-1">
              <Input type={show ? 'text' : 'password'} value={key} onChange={(e) => setKey(e.target.value)} placeholder="sk-ant-…" autoComplete="off" spellCheck={false} className="pe-10" aria-label={t('Anthropic API key', 'مفتاح Anthropic API')} />
              <button type="button" onClick={() => setShow((s) => !s)} className="absolute end-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center text-gypsum-500" aria-label={show ? t('Hide key', 'إخفاء') : t('Show key', 'إظهار')}>
                {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <Button type="submit" disabled={!key.trim() || testing} icon={testing ? <LoaderCircle className="size-4 animate-spin" /> : undefined}>
              {testing ? t('Checking…', 'جارٍ التحقق…') : t('Save & test', 'احفظ واختبر')}
            </Button>
          </form>
        )}
        <div className="mt-4 flex items-start gap-2 text-xs leading-snug text-gypsum-500">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-majlis-600" />
          <span>
            {t(`Model: ${MODEL} with server-side refusal fallback. Get a key at`, `النموذج: ${MODEL} مع بديل تلقائي عند الرفض. احصل على مفتاح من`)}{' '}
            <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer" className="font-semibold text-majlis-700 underline underline-offset-2">
              console.anthropic.com
            </a>
            . {t('Use a key with a spending limit for demos, and remove it from shared computers.', 'استخدم مفتاحاً بحد إنفاق للعروض، وأزله من الأجهزة المشتركة.')}
          </span>
        </div>
      </Card>

      <Card className="flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <p className="font-semibold text-majlis-950">{t('Language', 'اللغة')}</p>
          <p className="text-sm text-gypsum-600">{t('Arabic switches the whole app to right-to-left.', 'العربية تحوّل التطبيق بالكامل من اليمين إلى اليسار.')}</p>
        </div>
        <Segmented
          value={lang}
          onChange={setLang}
          options={[
            { value: 'en', label: 'English' },
            { value: 'ar', label: <span className="display">العربية</span> },
          ]}
        />
      </Card>

      <Card className="p-5">
        <p className="font-semibold text-majlis-950">{t('Reset demo data', 'إعادة ضبط بيانات العرض')}</p>
        <p className="mt-1 text-sm text-gypsum-600">
          {t('Clears your requests, bookings, reviews and posts in this browser and restores the sample data. Your Claude key is kept.', 'يمسح طلباتك وحجوزاتك وتقييماتك ومنشوراتك في هذا المتصفح ويعيد البيانات التجريبية. يبقى مفتاح Claude محفوظاً.')}
        </p>
        {confirmReset ? (
          <div className="mt-3 flex gap-2">
            <Button
              variant="danger"
              icon={<RotateCcw className="size-4" />}
              onClick={() => {
                dispatch({ type: 'reset', today: todayISO(), at: Date.now() });
                setConfirmReset(false);
                toast(t('Demo data restored.', 'تمت استعادة بيانات العرض.'), 'info');
              }}
            >
              {t('Yes, reset everything', 'نعم، أعد الضبط')}
            </Button>
            <Button variant="quiet" onClick={() => setConfirmReset(false)}>
              {t('Keep my data', 'احتفظ ببياناتي')}
            </Button>
          </div>
        ) : (
          <Button className="mt-3" variant="ghost" icon={<RotateCcw className="size-4" />} onClick={() => setConfirmReset(true)}>
            {t('Reset demo', 'إعادة ضبط العرض')}
          </Button>
        )}
      </Card>
    </div>
  );
}
