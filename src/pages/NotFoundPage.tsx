import React from 'react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 text-center">
      <div className="w-24 h-24 bg-danger/10 text-danger rounded-full flex items-center justify-center mb-6 border border-danger/20">
        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight mb-2">404 - Không Tìm Thấy Trang</h1>
      <p className="text-slate-500 text-sm max-w-md mb-6">Trang bạn đang truy cập không tồn tại hoặc đã được di chuyển sang địa chỉ khác.</p>
      <a
        href="/"
        className="py-2.5 px-6 bg-primary hover:bg-blue-700 text-white font-medium rounded-xl transition-all shadow-md shadow-primary/10 text-sm"
      >
        Quay lại Trang chủ
      </a>
    </div>
  );
};
