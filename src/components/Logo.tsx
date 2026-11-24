import { useI18n } from '../i18n/I18nProvider';

/** The majlis facade from the Majlisna logo, redrawn as a compact mark. */
export function LogoMark({ className = 'h-9 w-auto', mono = false }: { className?: string; mono?: boolean }) {
  const green = mono ? 'currentColor' : 'var(--color-majlis-800)';
  const gold = mono ? 'currentColor' : 'var(--color-dallah-500)';
  return (
    <svg viewBox="0 0 120 84" className={className} aria-hidden="true">
      {/* flag */}
      <line x1="60" y1="3" x2="60" y2="22" stroke={gold} strokeWidth="1.6" />
      {!mono && (
        <g>
          <rect x="61" y="3" width="15" height="10" fill="#fff" />
          <rect x="61" y="3" width="4" height="10" fill="var(--color-sadu-500)" />
          <rect x="65" y="3" width="11" height="3.33" fill="var(--color-majlis-500)" />
          <rect x="65" y="9.67" width="11" height="3.33" fill="var(--color-ink)" />
        </g>
      )}
      {/* wings */}
      <path d="M12 76V38h30M108 76V38H78" fill="none" stroke={green} strokeWidth="2.4" />
      <path d="M10 38l8-6h22M110 38l-8-6H80" fill="none" stroke={gold} strokeWidth="1.6" />
      <path d="M20 70V58a6 6 0 0 1 12 0v12M88 70V58a6 6 0 0 1 12 0v12" fill="none" stroke={gold} strokeWidth="1.6" />
      <circle cx="26" cy="49" r="1.6" fill={gold} />
      <circle cx="94" cy="49" r="1.6" fill={gold} />
      {/* central tower */}
      <rect x="40" y="21" width="40" height="3.2" rx="1" fill={gold} />
      <rect x="43" y="24" width="34" height="52" fill={green} />
      <path d="M48 76V46a6 6 0 0 1 12 0v30zM60 76V46a6 6 0 0 1 12 0v30z" fill={mono ? 'var(--color-gypsum-50)' : 'var(--color-gypsum-50)'} />
      <rect x="6" y="76" width="108" height="3" rx="1.5" fill={green} />
    </svg>
  );
}

export function Wordmark({ className = '', light = false, compact = false }: { className?: string; light?: boolean; compact?: boolean }) {
  const { lang } = useI18n();
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark className="h-8 w-auto shrink-0" mono={light} />
      <span className={`${compact ? 'hidden sm:flex' : 'flex'} flex-col leading-none`}>
        <span className={`display text-[1.35rem] font-semibold ${light ? 'text-gypsum-50' : 'text-majlis-800'}`}>
          {lang === 'ar' ? 'مجلسنا' : 'Majlisna'}
        </span>
        <span className={`display text-[0.7rem] ${light ? 'text-dallah-300' : 'text-dallah-600'}`}>
          {lang === 'ar' ? 'Majlisna' : 'مجلسنا'}
        </span>
      </span>
    </span>
  );
}
