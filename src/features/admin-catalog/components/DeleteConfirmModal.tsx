import React from 'react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ isOpen, onCancel, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '20px',
      animation: 'fadeIn 0.2s ease',
    }}>
      <div style={{
        background: '#fff', borderRadius: '16px', width: '100%',
        maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
        animation: 'scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
      }}>
        <div style={{ padding: '24px', textAlign: 'center' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%',
            background: '#fee2e2', color: '#ef4444', display: 'flex',
            alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px'
          }}>
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <h4 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>Xác nhận xóa</h4>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
            Bạn có chắc chắn muốn xóa bản ghi này? Hành động này không thể hoàn tác.
          </p>
        </div>
        <div style={{ padding: '12px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '10px', background: '#fafbfc' }}>
          <button onClick={onCancel} style={{
            padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0',
            background: '#fff', color: '#475569', fontSize: '13px', fontWeight: 600, cursor: 'pointer'
          }}>Hủy</button>
          <button onClick={onConfirm} style={{
            padding: '8px 20px', borderRadius: '8px', border: 'none',
            background: '#ef4444', color: '#fff', fontSize: '13px', fontWeight: 600,
            cursor: 'pointer', boxShadow: '0 4px 10px rgba(239,68,68,0.2)'
          }}>
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
};
