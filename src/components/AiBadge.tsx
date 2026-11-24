import { Sparkles } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import type { L10n } from '../domain/types';
import { cx } from './ui';

/**
 * Label on every AI surface: which engine answered, and which SLR theme the feature comes from.
 * Without a Claude key the prototype runs its built-in demo AI (rules and prepared answers).
 */
export function AiBadge({ source, theme, loading, className, dark }: { source?: 'claude' | 'fallback'; theme: L10n; loading?: boolean; className?: string; dark?: boolean }) {
  const { t, L } = useI18n();
  return (
    <div className={cx('flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.6875rem]', className)}>
      <span
        className={cx(
          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold',
          dark ? 'bg-white/10 text-dallah-200' : 'bg-dallah-50 text-dallah-700 ring-1 ring-inset ring-dallah-100',
        )}
      >
        <Sparkles className={cx('size-3', loading && 'animate-pulse')} />
        {loading ? t('Thinking…', 'يفكر…') : source === 'claude' ? 'Claude' : t('AI demo', 'ذكاء تجريبي')}
      </span>
      <span className={dark ? 'text-majlis-200' : 'text-gypsum-500'}>{L(theme)}</span>
    </div>
  );
}
