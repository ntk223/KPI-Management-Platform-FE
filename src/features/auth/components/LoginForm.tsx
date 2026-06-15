import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export const LoginForm: React.FC = () => {
  const { login, isLoading, error, isAuthenticated, user, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Basic Validation
    if (!email) {
      setValidationError('Vui lòng nhập địa chỉ email.');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setValidationError('Địa chỉ email không đúng định dạng.');
      return;
    }

    if (!password) {
      setValidationError('Vui lòng nhập mật khẩu.');
      return;
    }

    if (password.length < 6) {
      setValidationError('Mật khẩu phải chứa ít nhất 6 ký tự.');
      return;
    }

    try {
      await login({ email, password });
    } catch (err) {
      // Error handled by hook state
    }
  };

  // Quick fill helper for dev/testing ease
  const handleQuickFill = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('kpi123456');
    setValidationError(null);
  };

  if (isAuthenticated && user) {
    return (
      <div className="max-w-md w-full mx-auto bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center transition-all duration-300 transform hover:scale-[1.01]">
        <div className="w-20 h-20 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-4 border border-success/20">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-1">Đăng nhập thành công</h3>
        <p className="text-sm text-slate-500 mb-6">Xin chào, <span className="font-semibold text-slate-700">{user.name}</span>!</p>
        
        <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-200/60 text-left space-y-2.5">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Email:</span>
            <span className="font-semibold text-slate-700">{user.email}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500 font-medium">Vai trò:</span>
            <span className="font-bold px-2 py-0.5 rounded text-white bg-primary text-[10px] uppercase">
              {user.role}
            </span>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full py-2.5 px-4 bg-danger hover:bg-danger-dark text-white font-medium rounded-xl transition-all duration-200 active:scale-95 shadow-md shadow-danger/10"
        >
          Đăng xuất tài khoản
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md w-full mx-auto bg-white rounded-2xl shadow-2xl border border-slate-100/80 p-8 relative overflow-hidden transition-all duration-300">
      {/* Decorative top colored border */}
      <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-primary to-indigo-600" />
      
      <div className="text-center mb-8">
        <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Đăng Nhập Hệ Thống</h2>
        <p className="text-slate-400 text-xs mt-1.5">Nền tảng quản lý chỉ số KPI doanh nghiệp</p>
      </div>

      {/* Alert Error Box */}
      {(error || validationError) && (
        <div className="mb-5 p-3.5 bg-danger/10 border border-danger/30 text-danger rounded-xl flex items-start gap-2.5 text-xs animate-headShake">
          <svg className="w-5 h-5 flex-shrink-0 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="font-semibold">Lỗi đăng nhập</p>
            <p className="mt-0.5 opacity-90">{validationError || error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
            Địa chỉ Email
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" />
              </svg>
            </span>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ten.nguoidung@kpi-corp.vn"
              disabled={isLoading}
              className="w-full pl-9.5 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm text-slate-700 bg-slate-50/50 disabled:bg-slate-100 disabled:cursor-not-allowed transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
            Mật khẩu bảo mật
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isLoading}
              className="w-full pl-9.5 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm text-slate-700 bg-slate-50/50 disabled:bg-slate-100 disabled:cursor-not-allowed transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center py-2.5 px-4 bg-primary hover:bg-blue-700 text-white font-medium rounded-xl transition-all duration-200 active:scale-[0.98] disabled:bg-primary/60 disabled:cursor-not-allowed shadow-md shadow-primary/20 mt-1"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Đang xác thực thông tin...
            </>
          ) : (
            'Đăng nhập ngay'
          )}
        </button>
      </form>

      {/* Quick Fill section inside developer mode helper panel */}
      <div className="mt-8 pt-6 border-t border-slate-100 text-left">
        <h4 className="text-xs font-semibold text-slate-500 uppercase mb-3 tracking-wider flex items-center gap-1.5">
          <svg className="w-4 h-4 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Demo tài khoản lập nghiệp (Quick Fill):
        </h4>
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <button
            onClick={() => handleQuickFill('admin@kpi-corp.vn')}
            className="px-2.5 py-1.5 bg-role-admin/10 hover:bg-role-admin/20 border border-role-admin/20 text-role-admin rounded-lg font-medium text-left transition-colors"
          >
            🔑 Admin Role
          </button>
          <button
            onClick={() => handleQuickFill('director@kpi-corp.vn')}
            className="px-2.5 py-1.5 bg-role-director/10 hover:bg-role-director/20 border border-role-director/20 text-role-director rounded-lg font-medium text-left transition-colors"
          >
            🔑 Director Role
          </button>
          <button
            onClick={() => handleQuickFill('manager@kpi-corp.vn')}
            className="px-2.5 py-1.5 bg-role-manager/10 hover:bg-role-manager/20 border border-role-manager/20 text-role-manager rounded-lg font-medium text-left transition-colors"
          >
            🔑 Manager Role
          </button>
          <button
            onClick={() => handleQuickFill('employee@kpi-corp.vn')}
            className="px-2.5 py-1.5 bg-role-employee/10 hover:bg-role-employee/20 border border-role-employee/20 text-role-employee rounded-lg font-medium text-left transition-colors"
          >
            🔑 Employee Role
          </button>
        </div>
      </div>
    </div>
  );
};
