import { Sparkles } from 'lucide-react';
import { Link } from 'react-router';
import { useI18n } from '../i18n/I18nProvider';
import type { L10n } from '../domain/types';
import { cx } from './ui';

/** Honest label on every AI surface: which engine answered, and which SLR theme the feature comes from. */
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
        {loading ? t('Thinking…', 'يفكر…') : source === 'claude' ? 'Claude' : t('Scripted demo', 'ردود مبرمجة')}
      </span>
      <span className={dark ? 'text-majlis-200' : 'text-gypsum-500'}>{L(theme)}</span>
      {source === 'fallback' && !loading && (
        <Link to="/settings" className={cx('underline underline-offset-2', dark ? 'text-dallah-200' : 'text-majlis-600')}>
          {t('Turn on Claude', 'فعّل Claude')}
        </Link>
      )}
    </div>
  );
}
