import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { Bell, ChartLine, Landmark, Settings, Store, UserRound } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import { useStore } from '../store/StoreProvider';
import { unread } from '../store/reducer';
import type { Role } from '../domain/types';
import { ROLE } from '../i18n/labels';
import { formatRelative } from '../domain/dates';
import { Wordmark } from './Logo';
import { SaduBand } from './Sadu';
import { IconButton, cx } from './ui';

export const ROLE_PATH: Record<Role, string> = { resident: '/r', staff: '/staff', vendor: '/vendor', business: '/business' };
const ROLE_ICON: Record<Role, typeof UserRound> = { resident: UserRound, staff: Landmark, vendor: Store, business: ChartLine };

export function roleFromPath(path: string): Role | null {
  if (path.startsWith('/r')) return 'resident';
  if (path.startsWith('/staff')) return 'staff';
  if (path.startsWith('/vendor')) return 'vendor';
  if (path.startsWith('/business')) return 'business';
  return null;
}

export function LangToggle({ dark }: { dark?: boolean }) {
  const { lang, setLang } = useI18n();
  return (
    <button
      type="button"
      onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
      className={cx(
        'inline-flex h-9 items-center gap-1 rounded-xl px-2.5 text-[0.8125rem] font-semibold transition-colors',
        dark ? 'text-gypsum-100 hover:bg-white/10' : 'text-majlis-800 hover:bg-majlis-50',
      )}
      aria-label={lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
    >
      <span className={lang === 'en' ? 'opacity-100' : 'opacity-40'}>EN</span>
      <span className="opacity-30">/</span>
      <span className={cx('display', lang === 'ar' ? 'opacity-100' : 'opacity-40')}>ع</span>
    </button>
  );
}

export function AppHeader() {
  const { t, L, lang } = useI18n();
  const { state, dispatch } = useStore();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const role = roleFromPath(pathname) ?? state.role;
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const count = unread(state, role);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (panel.current && !panel.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  const goRole = (r: Role) => {
    dispatch({ type: 'setRole', role: r });
    navigate(ROLE_PATH[r]);
  };

  const mine = state.notifications.filter((n) => n.to === role).slice(0, 12);

  return (
    <header className="sticky top-0 z-40 bg-gypsum-50/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-2 px-3 sm:gap-4 sm:px-6">
        <Link to="/" className="shrink-0 rounded-xl" aria-label="Majlisna home">
          <Wordmark compact />
        </Link>
        <span className="hidden rounded-full bg-dallah-50 px-2.5 py-1 text-[0.6875rem] font-semibold text-dallah-700 ring-1 ring-inset ring-dallah-100 xl:inline">
          {t('Prototype · sample data', 'نموذج أولي · بيانات تجريبية')}
        </span>

        <nav aria-label={t('Switch view', 'تبديل الواجهة')} className="mx-auto flex rounded-2xl bg-gypsum-200/70 p-1">
          {(Object.keys(ROLE_PATH) as Role[]).map((r) => {
            const Icon = ROLE_ICON[r];
            const on = r === role;
            return (
              <button
                key={r}
                onClick={() => goRole(r)}
                aria-current={on ? 'page' : undefined}
                className={cx('relative flex h-9 items-center gap-2 rounded-xl px-2.5 text-[0.8125rem] font-semibold transition-colors sm:px-3.5', on ? 'text-majlis-900' : 'text-gypsum-600 hover:text-majlis-800')}
              >
                {on && <motion.span layoutId="role-pill" className="absolute inset-0 rounded-xl bg-white shadow-card" transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }} />}
                <Icon className="relative size-4" />
                <span className="relative hidden md:inline">{L(ROLE[r])}</span>
              </button>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-0.5">
          <LangToggle />
          <div className="relative" ref={panel}>
            <IconButton
              label={t('Notifications', 'الإشعارات')}
              onClick={() => {
                setOpen((o) => !o);
                if (!open && count) window.setTimeout(() => dispatch({ type: 'markRead', role }), 1200);
              }}
            >
              <Bell className="size-[18px]" />
              {count > 0 && (
                <span className="absolute end-1 top-1 grid min-w-4 place-items-center rounded-full bg-sadu-500 px-1 text-[0.625rem] font-bold leading-4 text-white">{count}</span>
              )}
            </IconButton>
            <AnimatePresence>
              {open && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.98 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute end-0 top-11 w-[min(92vw,22rem)] origin-top-right overflow-hidden rounded-2xl bg-white shadow-lift ring-1 ring-gypsum-200"
                >
                  <div className="flex items-center justify-between border-b border-gypsum-200 px-4 py-3">
                    <p className="text-sm font-semibold text-majlis-900">
                      {t('Notifications', 'الإشعارات')} · <span className="font-normal text-gypsum-500">{L(ROLE[role])}</span>
                    </p>
                  </div>
                  <ul className="max-h-80 overflow-y-auto scroll-thin">
                    {mine.length === 0 && <li className="px-4 py-8 text-center text-sm text-gypsum-500">{t('Nothing new yet.', 'لا جديد حالياً.')}</li>}
                    {mine.map((n) => (
                      <li key={n.id} className={cx('flex gap-3 border-b border-gypsum-100 px-4 py-3 last:border-0', !n.read && 'bg-dallah-50/60')}>
                        <span className={cx('mt-1.5 size-2 shrink-0 rounded-full', n.read ? 'bg-gypsum-300' : 'bg-sadu-500')} />
                        <div className="min-w-0">
                          <p className="text-[0.8125rem] leading-snug text-ink">{L(n.text)}</p>
                          <p className="mt-0.5 text-[0.6875rem] text-gypsum-500">{formatRelative(n.at, lang)}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <Link to="/settings" aria-label={t('Settings', 'الإعدادات')} className="hidden size-9 place-items-center rounded-xl text-majlis-800 hover:bg-majlis-50 sm:grid">
            <Settings className="size-[18px]" />
          </Link>
        </div>
      </div>
      <SaduBand height={8} />
    </header>
  );
}

export function PrototypeFooter() {
  const { t } = useI18n();
  return (
    <footer className="mx-auto max-w-[1400px] px-6 py-8 text-center text-xs leading-relaxed text-gypsum-500">
      {t(
        'Majlisna is a student prototype (Zayed University, Capstone & Venture Creation). All majlises, vendors and people are sample data. It is not an official government service.',
        'مجلسنا نموذج أولي لمشروع طلابي (جامعة زايد، مشروع التخرج وريادة الأعمال). جميع المجالس والموردين والأشخاص بيانات تجريبية، وليس خدمة حكومية رسمية.',
      )}
    </footer>
  );
}
