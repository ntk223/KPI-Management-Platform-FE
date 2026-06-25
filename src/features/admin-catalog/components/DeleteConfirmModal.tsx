import React from 'react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ isOpen, onCancel, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 dark:bg-zinc-950/60 backdrop-blur-sm flex items-center justify-center z-[1000] p-5 animate-[fadeIn_0.2s_ease]">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-[400px] shadow-xl border border-slate-200 dark:border-zinc-800 overflow-hidden flex flex-col animate-[scaleUp_0.3s_cubic-bezier(0.34,1.56,0.64,1)_forwards]">
        <div className="p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-rose-50 dark:bg-rose-950/30 text-rose-500 dark:text-rose-400 flex items-center justify-center mx-auto mb-4 border border-rose-100 dark:border-rose-900/40">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <h4 className="m-0 mb-2 text-base font-bold text-slate-900 dark:text-zinc-50">Xác nhận xóa</h4>
          <p className="m-0 text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
            Bạn có chắc chắn muốn xóa bản ghi này? Hành động này không thể hoàn tác.
          </p>
        </div>
        <div className="px-6 py-3 border-t border-slate-100 dark:border-zinc-800/60 flex justify-end gap-3 bg-slate-50/30 dark:bg-zinc-900/40">
          <button 
            onClick={onCancel} 
            className="px-4 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 text-xs font-semibold cursor-pointer transition-colors"
          >
            Hủy
          </button>
          <button 
            onClick={onConfirm} 
            className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer shadow-md shadow-rose-600/10 active:scale-[0.98] transition-all"
          >
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
};
