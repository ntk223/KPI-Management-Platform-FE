import React, { createContext, useContext, useState, useCallback } from 'react';

export interface ToastMsg {
  id: string;
  text: string;
  type: 'success' | 'error' | 'info';
  isExiting?: boolean;
}

interface ToastContextType {
  showToast: (text: string, type: 'success' | 'error' | 'info') => void;
  success: (text: string) => void;
  error: (text: string) => void;
  info: (text: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMsg[]>([]);

  const showToast = useCallback((text: string, type: 'success' | 'error' | 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, text, type, isExiting: false }]);

    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, isExiting: true } : t))
      );
    }, 2700);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const success = useCallback((text: string) => showToast(text, 'success'), [showToast]);
  const error = useCallback((text: string) => showToast(text, 'error'), [showToast]);
  const info = useCallback((text: string) => showToast(text, 'info'), [showToast]);

  React.useEffect(() => {
    const handleRateLimit = (e: Event) => {
      const customEvent = e as CustomEvent<{ message: string }>;
      error(customEvent.detail?.message || 'Bạn đã thao tác quá nhanh. Vui lòng thử lại sau.');
    };
    window.addEventListener('api-rate-limited', handleRateLimit);
    return () => window.removeEventListener('api-rate-limited', handleRateLimit);
  }, [error]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, info }}>
      {children}
      {/* Toast Render container */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5">
        {toasts.map((t) => {
          const borderClasses = 
            t.type === 'success'
              ? 'border-l-4 border-l-emerald-500 text-slate-800 dark:text-zinc-150 border-y border-r border-slate-150 dark:border-zinc-800'
              : t.type === 'error'
              ? 'border-l-4 border-l-rose-500 text-slate-800 dark:text-zinc-150 border-y border-r border-slate-150 dark:border-zinc-800'
              : 'border-l-4 border-l-indigo-500 text-slate-800 dark:text-zinc-150 border-y border-r border-slate-150 dark:border-zinc-800';

          const iconColor =
            t.type === 'success'
              ? 'text-emerald-500'
              : t.type === 'error'
              ? 'text-rose-500'
              : 'text-indigo-500';

          const animationClass = t.isExiting
            ? 'animate-[slideOut_0.25s_ease-in_forwards]'
            : 'animate-[slideIn_0.4s_cubic-bezier(0.34,1.56,0.64,1)_forwards]';

          return (
            <div
              key={t.id}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl bg-white dark:bg-zinc-900 text-[13px] font-bold shadow-lg ${animationClass} translate-x-[120%] ${borderClasses}`}
            >
              {t.type === 'success' && (
                <svg className={`w-4 h-4 flex-shrink-0 ${iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {t.type === 'error' && (
                <svg className={`w-4 h-4 flex-shrink-0 ${iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
              {t.type === 'info' && (
                <svg className={`w-4 h-4 flex-shrink-0 ${iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <span>{t.text}</span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
