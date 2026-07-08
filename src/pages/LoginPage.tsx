import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth';
import * as Icon from '../components/icons';

const ROLES = [
  { label: 'Admin', username: 'admin', color: '#7c3aed', bg: 'rgba(124,58,237,0.08)', border: 'rgba(124,58,237,0.25)', icon: 'Key' },
  { label: 'Director', username: 'director', color: '#0ea5e9', bg: 'rgba(14,165,233,0.08)', border: 'rgba(14,165,233,0.25)', icon: 'Target' },
  { label: 'Manager', username: 'manager_it', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', icon: 'BarChart' },
  { label: 'Employee', username: 'emp_it', color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.25)', icon: 'User' },
];

const SYSTEM_PILLARS = [
  {
    icon: 'Target',
    title: 'Phân rã Chỉ tiêu',
    desc: 'Thiết lập và giao chỉ tiêu KPI từ cấp công ty đến từng cá nhân.',
  },
  {
    icon: 'TrendingUp',
    title: 'Theo dõi Real-time',
    desc: 'Cập nhật tiến độ liên tục bằng biểu đồ và báo cáo trực quan.',
  },
  {
    icon: 'ClipboardList',
    title: 'Đánh giá & Duyệt',
    desc: 'Quy trình tự đánh giá, nhận xét và phê duyệt kết quả minh bạch.',
  },
  {
    icon: 'Shield',
    title: 'Bảo mật Phân quyền',
    desc: 'Phân quyền chặt chẽ theo vai trò (Admin, Manager, Employee).',
  },
];

export const LoginPage: React.FC = () => {
  const { login, isLoading, error, isAuthenticated, clearError } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  const validate = () => {
    if (!username.trim()) return 'Vui lòng nhập username.';
    if (!password) return 'Vui lòng nhập mật khẩu.';
    if (password.length < 6) return 'Mật khẩu phải có ít nhất 6 ký tự.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    const err = validate();
    if (err) { setLocalError(err); return; }
    try {
      await login({ username, password });
      navigate('/dashboard', { replace: true });
    } catch {
      // error handled via context
    }
  };

  const quickFill = (roleUsername: string) => {
    setUsername(roleUsername);
    setPassword('kpi123456');
    setLocalError(null);
    clearError();
  };

  const displayError = localError || error;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* ─── LEFT PANEL — Brand / Visual ─── */}
      <div style={{
        flex: '0 0 45%',
        background: 'linear-gradient(145deg, #0f172a 0%, #1e3a5f 45%, #1a3a5c 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '48px',
        position: 'relative',
        overflow: 'hidden',
      }}
        className="hidden lg:flex"
      >
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '320px', height: '320px', borderRadius: '50%', background: 'rgba(99,102,241,0.12)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-60px', left: '-60px', width: '280px', height: '280px', borderRadius: '50%', background: 'rgba(14,165,233,0.10)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '38%', left: '30%', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(16,185,129,0.06)', pointerEvents: 'none' }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', zIndex: 1 }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366f1, #0ea5e9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: '20px', color: '#fff', boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
          }}>K</div>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: '18px', letterSpacing: '0.05em' }}>KPI Portal</div>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px', letterSpacing: '0.08em' }}>ENTERPRISE MANAGEMENT</div>
          </div>
        </div>

        {/* Center content */}
        <div style={{ zIndex: 1 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '100px',
            background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
            color: '#a5b4fc', fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em',
            marginBottom: '24px',
          }}>
            <Icon.Sparkles style={{ width: '12px', height: '12px' }} />
            HỆ THỐNG QUẢN LÝ KPI CHO DOANH NGHIỆP
          </div>
          <h1 style={{ color: '#fff', fontSize: '32px', fontWeight: 800, lineHeight: 1.2, marginBottom: '16px' }}>
            Quản lý hiệu suất<br />
            <span style={{ background: 'linear-gradient(90deg, #6366f1, #0ea5e9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              thông minh & tối ưu
            </span>
          </h1>

          {/* System Pillars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {SYSTEM_PILLARS.map((p, i) => {
              const IconComponent = Icon[p.icon as keyof typeof Icon];
              return (
                <div key={i} style={{
                  display: 'flex', gap: '14px', alignItems: 'center',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  padding: '12px 16px', borderRadius: '12px',
                }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '8px',
                    background: 'rgba(99,102,241,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#818cf8', flexShrink: 0
                  }}>
                    {IconComponent && <IconComponent style={{ width: '16px', height: '16px' }} />}
                  </div>
                  <div>
                    <h3 style={{ color: '#fff', fontSize: '13px', fontWeight: 600, marginBottom: '2px' }}>{p.title}</h3>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', lineHeight: 1.4 }}>{p.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom quote */}
        <div style={{ zIndex: 1, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '24px' }}>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', fontStyle: 'italic' }}>
            "Những gì được đo lường mới được quản lý."
          </p>
          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px', marginTop: '4px' }}>— Peter Drucker</p>
        </div>
      </div>

      {/* ─── RIGHT PANEL — Login Form ─── */}
      <div style={{
        flex: 1, background: '#f8fafc',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '32px 24px',
      }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          {/* Mobile logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' }} className="lg:hidden">
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1, #0ea5e9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, color: '#fff',
            }}>K</div>
            <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '16px' }}>KPI Portal</span>
          </div>

          <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>Đăng nhập</h2>
          <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '32px' }}>
            Nhập thông tin tài khoản để truy cập hệ thống
          </p>

          {/* Error alert */}
          {displayError && (
            <div style={{
              padding: '12px 16px', borderRadius: '10px',
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
              color: '#dc2626', fontSize: '13px', marginBottom: '20px',
              display: 'flex', alignItems: 'flex-start', gap: '10px',
            }}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ flexShrink: 0, marginTop: '1px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <span>{displayError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Username field */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Tên đăng nhập
              </label>
              <div style={{ position: 'relative' }}>
                <svg style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <input
                  id="login-username"
                  type="text"
                  value={username}
                  onChange={e => { setUsername(e.target.value); setLocalError(null); clearError(); }}
                  placeholder="ten.nguoidung"
                  disabled={isLoading}
                  autoComplete="username"
                  style={{
                    width: '100%', padding: '11px 14px 11px 40px',
                    border: '1.5px solid #e2e8f0', borderRadius: '10px',
                    fontSize: '14px', color: '#1e293b', background: '#fff',
                    outline: 'none', boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                    opacity: isLoading ? 0.6 : 1,
                  }}
                  onFocus={e => (e.target.style.borderColor = '#6366f1')}
                  onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Mật khẩu
              </label>
              <div style={{ position: 'relative' }}>
                <svg style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setLocalError(null); clearError(); }}
                  placeholder="••••••••"
                  disabled={isLoading}
                  autoComplete="current-password"
                  style={{
                    width: '100%', padding: '11px 44px 11px 40px',
                    border: '1.5px solid #e2e8f0', borderRadius: '10px',
                    fontSize: '14px', color: '#1e293b', background: '#fff',
                    outline: 'none', boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                    opacity: isLoading ? 0.6 : 1,
                  }}
                  onFocus={e => (e.target.style.borderColor = '#6366f1')}
                  onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}
                >
                  {showPassword ? (
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  ) : (
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <button
              id="login-submit"
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%', padding: '13px',
                background: isLoading ? '#94a3b8' : 'linear-gradient(135deg, #6366f1, #0ea5e9)',
                color: '#fff', border: 'none', borderRadius: '10px',
                fontSize: '14px', fontWeight: 600, cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
                transition: 'all 0.2s', marginTop: '4px',
              }}
            >
              {isLoading ? (
                <>
                  <svg style={{ animation: 'spin 1s linear infinite' }} width="18" height="18" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth={3} />
                    <path d="M12 2a10 10 0 0110 10" stroke="#fff" strokeWidth={3} strokeLinecap="round" />
                  </svg>
                  Đang xác thực...
                </>
              ) : (
                <>
                  Đăng nhập
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </>
              )}
            </button>
          </form>

          {/* Quick fill */}
          <div style={{ marginTop: '28px', padding: '16px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Icon.Zap style={{ width: '14px', height: '14px', color: '#f59e0b' }} />
              Demo nhanh (Dev mode)
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {ROLES.map(r => {
                const IconComponent = Icon[r.icon as keyof typeof Icon];
                return (
                  <button
                    key={r.label}
                    type="button"
                    onClick={() => quickFill(r.username)}
                    style={{
                      padding: '8px 10px', borderRadius: '8px',
                      background: r.bg, border: `1px solid ${r.border}`,
                      color: r.color, fontSize: '11px', fontWeight: 600,
                      cursor: 'pointer', textAlign: 'left',
                      transition: 'all 0.15s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    {IconComponent && <IconComponent style={{ width: '13px', height: '13px' }} />}
                    {r.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: #cbd5e1; }
      `}</style>
    </div>
  );
};
