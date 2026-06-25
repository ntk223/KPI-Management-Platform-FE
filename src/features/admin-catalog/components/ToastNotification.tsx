import React from 'react';
import { ToastMsg } from '../types';

interface ToastNotificationProps {
  toasts: ToastMsg[];
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({ toasts }) => {
  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5">
      {toasts.map(t => (
        <div 
          key={t.id} 
          className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-white text-[13px] font-semibold shadow-lg animate-[slideIn_0.3s_cubic-bezier(0.16,1,0.3,1)_forwards] translate-x-[120%] ${
            t.type === 'success' 
              ? 'bg-emerald-500' 
              : t.type === 'error' 
                ? 'bg-rose-500' 
                : 'bg-indigo-500'
          }`}
        >
          {t.type === 'success' && (
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          )}
          {t.type === 'error' && (
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )}
          <span>{t.text}</span>
        </div>
      ))}
    </div>
  );
};
