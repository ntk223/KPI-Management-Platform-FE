import React from 'react';
import { ToastMsg } from '../types';

interface ToastNotificationProps {
  toasts: ToastMsg[];
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({ toasts }) => {
  return (
    <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 18px',
          borderRadius: '10px', color: '#fff', fontSize: '13px', fontWeight: 600,
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
          background: t.type === 'success' ? '#10b981' : t.type === 'error' ? '#ef4444' : '#6366f1',
          animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          transform: 'translateX(120%)',
        }}>
          {t.type === 'success' && (
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          )}
          {t.type === 'error' && (
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )}
          <span>{t.text}</span>
        </div>
      ))}
    </div>
  );
};
