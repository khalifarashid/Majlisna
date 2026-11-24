import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CircleCheck as CheckCircle2, Info, TriangleExclamationPoint as AlertTriangle } from 'lucide-react';
import { onStoreError } from '../store/StoreProvider';

type Kind = 'success' | 'error' | 'info';
interface Toast {
  id: number;
  kind: Kind;
  text: string;
}

const ToastContext = createContext<(text: string, kind?: Kind) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((text: string, kind: Kind = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-2), { id, kind, text }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === 'error' ? 5200 : 3200);
  }, []);

  useEffect(() => onStoreError((m) => push(m, 'error')), [push]);

  const value = useMemo(() => push, [push]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-6" aria-live="polite">
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ type: 'spring', duration: 0.35, bounce: 0.2 }}
              className="pointer-events-auto flex max-w-md items-start gap-2.5 rounded-2xl bg-majlis-950 px-4 py-3 text-sm text-gypsum-50 shadow-lift"
            >
              {t.kind === 'success' && <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-dallah-300" />}
              {t.kind === 'error' && <AlertTriangle className="mt-0.5 size-4 shrink-0 text-sadu-100" />}
              {t.kind === 'info' && <Info className="mt-0.5 size-4 shrink-0 text-majlis-200" />}
              <span>{t.text}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
