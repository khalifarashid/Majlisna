import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');
export { cx };

type Variant = 'primary' | 'gold' | 'ghost' | 'quiet' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-majlis-800 text-gypsum-50 hover:bg-majlis-700 shadow-[inset_0_-2px_0_rgb(0_0_0/0.18)]',
  gold: 'bg-dallah-500 text-majlis-950 hover:bg-dallah-400 shadow-[inset_0_-2px_0_rgb(0_0_0/0.14)]',
  ghost: 'bg-white text-majlis-800 ring-1 ring-gypsum-300 hover:ring-majlis-300 hover:bg-majlis-50',
  quiet: 'bg-transparent text-majlis-700 hover:bg-majlis-50',
  danger: 'bg-white text-sadu-600 ring-1 ring-sadu-100 hover:bg-sadu-50',
};
const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-[0.8125rem] gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-5 text-[0.9375rem] gap-2 rounded-xl',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  block?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', icon, block, className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cx(
        'inline-flex select-none items-center justify-center font-semibold whitespace-nowrap transition-[background-color,box-shadow,transform,color] duration-150 ease-out active:scale-[0.97] disabled:opacity-45 disabled:active:scale-100',
        VARIANTS[variant],
        SIZES[size],
        block && 'w-full',
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
});

export function IconButton({ label, className, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      aria-label={label}
      title={label}
      className={cx('relative inline-grid size-9 place-items-center rounded-xl text-majlis-800 transition-colors hover:bg-majlis-50 active:scale-95', className)}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Card({ className, children, as: As = 'div' }: { className?: string; children: ReactNode; as?: 'div' | 'section' | 'article' | 'li' }) {
  return <As className={cx('rounded-2xl bg-white shadow-card ring-1 ring-gypsum-200/70', className)}>{children}</As>;
}

type Tone = 'green' | 'gold' | 'red' | 'grey' | 'ink';
const TONES: Record<Tone, string> = {
  green: 'bg-majlis-50 text-majlis-700 ring-majlis-100',
  gold: 'bg-dallah-50 text-dallah-700 ring-dallah-100',
  red: 'bg-sadu-50 text-sadu-600 ring-sadu-100',
  grey: 'bg-gypsum-100 text-gypsum-600 ring-gypsum-200',
  ink: 'bg-majlis-900 text-gypsum-50 ring-majlis-900',
};

export function Badge({ tone = 'grey', className, children, icon }: { tone?: Tone; className?: string; children: ReactNode; icon?: ReactNode }) {
  return (
    <span className={cx('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.71875rem] font-semibold ring-1 ring-inset whitespace-nowrap', TONES[tone], className)}>
      {icon}
      {children}
    </span>
  );
}

export function Chip({ active, onClick, children, className }: { active?: boolean; onClick?: () => void; children: ReactNode; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        'inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[0.8125rem] font-medium whitespace-nowrap ring-1 transition-all duration-150 active:scale-95',
        active ? 'bg-majlis-800 text-gypsum-50 ring-majlis-800' : 'bg-white text-gypsum-700 ring-gypsum-300 hover:ring-majlis-300',
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Field({ label, hint, children, className }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cx('flex flex-col gap-1.5', className)}>
      <span className="text-[0.8125rem] font-semibold text-gypsum-700">{label}</span>
      {children}
      {hint && <span className="text-xs text-gypsum-500">{hint}</span>}
    </label>
  );
}

const control =
  'w-full rounded-xl bg-white px-3.5 text-[0.9375rem] text-ink ring-1 ring-gypsum-300 outline-none transition-shadow placeholder:text-gypsum-400 focus:ring-2 focus:ring-majlis-500';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...rest }, ref) {
  return <input ref={ref} className={cx(control, 'h-11', className)} {...rest} />;
});

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cx(control, 'h-11 appearance-none bg-[length:12px] bg-no-repeat', className)} {...rest}>
      {children}
    </select>
  );
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx(control, 'min-h-24 resize-y py-2.5 leading-relaxed', className)} {...rest} />;
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  className,
  size = 'md',
}: {
  value: T;
  options: { value: T; label: ReactNode }[];
  onChange: (v: T) => void;
  className?: string;
  size?: 'sm' | 'md';
}) {
  return (
    <div role="tablist" className={cx('inline-flex rounded-xl bg-gypsum-200/70 p-1', className)}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={on}
            onClick={() => onChange(o.value)}
            className={cx(
              'relative rounded-lg font-semibold whitespace-nowrap transition-colors',
              size === 'sm' ? 'h-7 px-2.5 text-xs' : 'h-8 px-3.5 text-[0.8125rem]',
              on ? 'text-majlis-900' : 'text-gypsum-600 hover:text-majlis-800',
            )}
          >
            {on && <motion.span layoutId={`seg-${options.map((x) => x.value).join('')}`} className="absolute inset-0 rounded-lg bg-white shadow-card" transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }} />}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function Empty({ icon, title, body, action }: { icon?: ReactNode; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
      {icon && <div className="arch mb-1 grid h-14 w-12 place-items-center bg-majlis-50 text-majlis-600 [--arch-base:8px] [--arch-rise:44%]">{icon}</div>}
      <p className="font-semibold text-majlis-900">{title}</p>
      {body && <p className="max-w-xs text-sm text-gypsum-600">{body}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function SectionTitle({ eyebrow, title, action, className }: { eyebrow?: string; title: string; action?: ReactNode; className?: string }) {
  return (
    <div className={cx('flex items-end justify-between gap-3', className)}>
      <div>
        {eyebrow && <p className="eyebrow mb-1 text-dallah-600">{eyebrow}</p>}
        <h2 className="display text-xl font-semibold text-majlis-900">{title}</h2>
      </div>
      {action}
    </div>
  );
}

/** Bottom sheet on phones, centred dialog on larger screens. */
export function Sheet({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={title}>
          <motion.div className="absolute inset-0 bg-majlis-950/40 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            className={cx('relative max-h-[88dvh] w-full overflow-y-auto rounded-t-3xl bg-gypsum-50 p-5 shadow-lift scroll-thin sm:rounded-3xl', wide ? 'sm:max-w-2xl' : 'sm:max-w-md')}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.4, bounce: 0.1 }}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="display text-lg font-semibold text-majlis-900">{title}</h3>
              <IconButton label="Close" onClick={onClose}>
                <X className="size-4" />
              </IconButton>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function Stat({ label, value, sub, tone = 'default' }: { label: string; value: ReactNode; sub?: ReactNode; tone?: 'default' | 'green' | 'red' | 'gold' }) {
  const color = tone === 'green' ? 'text-majlis-700' : tone === 'red' ? 'text-sadu-600' : tone === 'gold' ? 'text-dallah-700' : 'text-majlis-950';
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="text-xs font-medium text-gypsum-600">{label}</span>
      <span className={cx('num truncate text-2xl font-medium', color)}>{value}</span>
      {sub && <span className="text-xs text-gypsum-500">{sub}</span>}
    </div>
  );
}
