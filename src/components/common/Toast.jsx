import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
};

const TONES = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
  error: 'border-rose-200 bg-rose-600 text-white dark:border-rose-900 dark:bg-rose-950 dark:text-rose-100',
  info: 'border-sky-200 bg-sky-600 text-white dark:border-sky-900 dark:bg-sky-950 dark:text-sky-100',
};

/** Wrap the app in this once; call useToast() anywhere below it. */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message, type = 'info', duration = 4000) => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, message, type }]);
      if (duration) {
        setTimeout(() => dismiss(id), duration);
      }
    },
    [dismiss]
  );

  const value = useMemo(
    () => ({
      success: (msg, duration) => push(msg, 'success', duration),
      error: (msg, duration) => push(msg, 'error', duration),
      info: (msg, duration) => push(msg, 'info', duration),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed left-3 right-3 top-20 z-[100] flex max-w-[calc(100vw-1.5rem)] flex-col gap-2 sm:left-4 sm:top-20 sm:max-w-sm">
        {toasts.map((t) => {
          const Icon = ICONS[t.type];
          return (
            <div
              key={t.id}
              role="status"
              className={`pointer-events-auto flex w-full animate-pop-in items-start gap-2 rounded-xl border px-3 py-3 shadow-card sm:px-4 ${TONES[t.type]}`}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0" />
              <p className="flex-1 text-sm leading-5">{t.message}</p>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
                className="shrink-0 opacity-60 transition-opacity hover:opacity-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
