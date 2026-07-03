import React, { useState } from 'react';
import { useAuth } from '../features/auth';
import { useToast } from '../context';
import { apiClient } from '../services/apiClient';
import {
  User as UserIcon,
  Shield,
  Briefcase,
  Mail,
  Building,
  Key,
  Calendar,
  Lock,
  Loader2,
  CheckCircle2,
  UserCheck
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'info' | 'work' | 'security'>('info');

  // Change password form state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Password strength logic
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, text: 'Chưa nhập', color: 'bg-slate-200' };
    let score = 0;
    if (pass.length >= 6) score++;
    if (pass.length >= 10) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    switch (score) {
      case 1:
      case 2:
        return { score, text: 'Yếu', color: 'bg-rose-500' };
      case 3:
      case 4:
        return { score, text: 'Trung bình', color: 'bg-amber-500' };
      case 5:
        return { score, text: 'Mạnh', color: 'bg-emerald-500' };
      default:
        return { score: 0, text: 'Yếu', color: 'bg-rose-500' };
    }
  };

  const strength = getPasswordStrength(newPassword);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error('Vui lòng điền đầy đủ các thông tin mật khẩu');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Mật khẩu mới phải chứa ít nhất 6 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Xác nhận mật khẩu mới không khớp');
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post('/auth/change-password', {
        oldPassword,
        newPassword
      });

      if (res.data.success) {
        toast.success('Đổi mật khẩu thành công!');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error(res.data.message || 'Mật khẩu hiện tại không chính xác');
      }
    } catch (err: any) {
      console.error('Password change error:', err);
      const msg = err.response?.data?.message || 'Có lỗi xảy ra khi đổi mật khẩu';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'DIRECTOR':
        return <span className="px-3 py-1 text-xs font-bold rounded-full bg-red-50 text-red-650 border border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900">Ban Giám Đốc</span>;
      case 'MANAGER':
        return <span className="px-3 py-1 text-xs font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900">Trưởng Phòng</span>;
      default:
        return <span className="px-3 py-1 text-xs font-bold rounded-full bg-indigo-50 text-indigo-650 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900">Nhân Viên</span>;
    }
  };

  // Get user avatar initials
  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Title Header Section */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-zinc-150 flex items-center gap-2">
          <UserIcon className="w-5 h-5 text-indigo-600" />
          Hồ sơ cá nhân
        </h2>
        <p className="text-xs text-slate-400 font-semibold mt-1">
          Quản lý thông tin cá nhân, vị trí công tác và thiết lập bảo mật tài khoản
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: HERO AVATAR CARD & TABS SELECTOR */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden text-center p-6 relative">
            {/* Elegant header gradient background decoration */}
            <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-r from-indigo-600 via-indigo-750 to-violet-650 z-0" />
            
            <div className="relative z-10 flex flex-col items-center mt-6">
              {/* Avatar circle */}
              <div className="w-24 h-24 rounded-full border-4 border-white dark:border-zinc-900 bg-gradient-to-tr from-indigo-500 to-violet-600 text-white flex items-center justify-center font-black text-2xl shadow-md">
                {getInitials(user?.fullName || '')}
              </div>

              <h3 className="mt-4 text-base font-extrabold text-slate-850 dark:text-zinc-100">
                {user?.fullName || 'Người dùng'}
              </h3>
              <p className="text-xs text-slate-450 dark:text-zinc-500 font-medium mt-1">
                @{user?.username || 'username'}
              </p>

              <div className="mt-3 flex items-center justify-center gap-2">
                {getRoleBadge(user?.role || 'EMPLOYEE')}
              </div>
            </div>

            {/* Quick overview stats */}
            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-zinc-850 grid grid-cols-2 gap-4">
              <div className="text-left">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Phòng ban</span>
                <span className="text-xs font-extrabold text-slate-700 dark:text-zinc-250 mt-1 block truncate">
                  {user?.department?.name || 'Chưa cập nhật'}
                </span>
              </div>
              <div className="text-left border-l border-slate-100 dark:border-zinc-850 pl-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Chức danh</span>
                <span className="text-xs font-extrabold text-slate-700 dark:text-zinc-250 mt-1 block truncate">
                  {user?.position || 'Chưa cập nhật'}
                </span>
              </div>
            </div>
          </div>

          {/* TAB BUTTONS LIST */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-2.5 shadow-sm space-y-1">
            <button
              onClick={() => setActiveTab('info')}
              className={`w-full flex items-center gap-3 p-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'info'
                  ? 'bg-indigo-50/80 border-indigo-200 dark:bg-indigo-950/20 dark:border-indigo-850 text-indigo-650 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/40'
              }`}
            >
              <UserIcon className="w-4 h-4" />
              Thông tin cá nhân
            </button>
            <button
              onClick={() => setActiveTab('work')}
              className={`w-full flex items-center gap-3 p-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'work'
                  ? 'bg-indigo-50/80 border-indigo-200 dark:bg-indigo-950/20 dark:border-indigo-850 text-indigo-650 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/40'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              Công việc & Trách nhiệm
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center gap-3 p-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'security'
                  ? 'bg-indigo-50/80 border-indigo-200 dark:bg-indigo-950/20 dark:border-indigo-850 text-indigo-650 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/40'
              }`}
            >
              <Shield className="w-4 h-4" />
              Bảo mật tài khoản
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: DETAIL PANELS */}
        <div className="lg:col-span-8 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden p-6">
          {/* TAB 1: PERSONAL INFORMATION */}
          {activeTab === 'info' && (
            <div className="space-y-6">
              <h3 className="text-sm font-extrabold uppercase text-slate-800 dark:text-zinc-250 border-b border-slate-100 dark:border-zinc-800 pb-3 flex items-center gap-2">
                <UserIcon className="w-4.5 h-4.5 text-indigo-500" />
                Thông Tin Cá Nhân Cơ Bản
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Họ và tên</span>
                  <div className="bg-slate-50 dark:bg-zinc-950/40 px-4 py-3 rounded-xl border border-slate-150 dark:border-zinc-850 text-sm font-bold text-slate-800 dark:text-zinc-250">
                    {user?.fullName}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Mã số nhân sự</span>
                  <div className="bg-slate-50 dark:bg-zinc-950/40 px-4 py-3 rounded-xl border border-slate-150 dark:border-zinc-850 text-sm font-bold text-slate-800 dark:text-zinc-250">
                    EMP-2026-{String(user?.employeeId ?? 1).padStart(3, '0')}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Địa chỉ Email</span>
                  <div className="bg-slate-50 dark:bg-zinc-950/40 px-4 py-3 rounded-xl border border-slate-150 dark:border-zinc-850 text-sm font-bold text-slate-800 dark:text-zinc-250 flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-slate-400" />
                    {user?.email || 'Chưa cập nhật'}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tài khoản đăng nhập</span>
                  <div className="bg-slate-50 dark:bg-zinc-950/40 px-4 py-3 rounded-xl border border-slate-150 dark:border-zinc-850 text-sm font-bold text-slate-800 dark:text-zinc-250">
                    {user?.username}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ngày tham gia hệ thống</span>
                  <div className="bg-slate-50 dark:bg-zinc-950/40 px-4 py-3 rounded-xl border border-slate-150 dark:border-zinc-850 text-sm font-bold text-slate-800 dark:text-zinc-250 flex items-center gap-2.5">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>01/01/2026</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Hình thức làm việc</span>
                  <div className="bg-slate-50 dark:bg-zinc-950/40 px-4 py-3 rounded-xl border border-slate-150 dark:border-zinc-850 text-sm font-bold text-slate-800 dark:text-zinc-250">
                    Toàn thời gian (Full-time)
                  </div>
                </div>
              </div>

              {/* Note banner */}
              <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900 rounded-xl flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-indigo-900/80 dark:text-indigo-300 leading-relaxed font-semibold">
                  Mọi yêu cầu điều chỉnh thông tin cá nhân cơ bản (họ tên, email, mã số nhân viên) vui lòng gửi yêu cầu đến Bộ phận Nhân sự (HR) để thực hiện rà soát và phê duyệt thủ công.
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: WORK & JOB RESPONSIBILITIES */}
          {activeTab === 'work' && (
            <div className="space-y-6">
              <h3 className="text-sm font-extrabold uppercase text-slate-800 dark:text-zinc-250 border-b border-slate-100 dark:border-zinc-800 pb-3 flex items-center gap-2">
                <Briefcase className="w-4.5 h-4.5 text-indigo-500" />
                Vị Trí Công Tác & Cơ Cấu Tổ Chức
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Phòng ban trực thuộc</span>
                  <div className="bg-slate-50 dark:bg-zinc-950/40 px-4 py-3 rounded-xl border border-slate-150 dark:border-zinc-850 text-sm font-bold text-slate-800 dark:text-zinc-250 flex items-center gap-2.5">
                    <Building className="w-4 h-4 text-slate-400" />
                    {user?.department?.name || 'Không'}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Chức danh công tác</span>
                  <div className="bg-slate-50 dark:bg-zinc-950/40 px-4 py-3 rounded-xl border border-slate-150 dark:border-zinc-850 text-sm font-bold text-slate-800 dark:text-zinc-250">
                    {user?.position || 'Nhân sự'}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Người quản lý trực tiếp</span>
                  <div className="bg-slate-50 dark:bg-zinc-950/40 px-4 py-3 rounded-xl border border-slate-150 dark:border-zinc-850 text-sm font-bold text-slate-800 dark:text-zinc-250 flex items-center gap-2.5">
                    <UserCheck className="w-4 h-4 text-slate-400" />
                    {user?.role === 'DIRECTOR' ? 'Hội đồng quản trị' : user?.role === 'MANAGER' ? 'Ban Giám Đốc' : 'Trưởng phòng ' + (user?.department?.name || '')}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Quyền hạn hệ thống</span>
                  <div className="bg-slate-50 dark:bg-zinc-950/40 px-4 py-3 rounded-xl border border-slate-150 dark:border-zinc-850 text-xs font-bold text-slate-700 dark:text-zinc-250">
                    {user?.roles?.join(', ') || user?.role || 'EMPLOYEE'}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Phạm vi công việc & KPI liên quan</span>
                <div className="border border-slate-150 dark:border-zinc-850 rounded-xl divide-y divide-slate-100 dark:divide-zinc-850 overflow-hidden text-xs">
                  <div className="p-4 bg-slate-50/50 dark:bg-zinc-950/10 flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-slate-700 dark:text-zinc-200">Đánh giá chỉ tiêu cá nhân</h4>
                      <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold mt-0.5">Thực hiện cập nhật tiến độ tự động hoặc chấm điểm tự đánh giá</p>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-650 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-full font-bold text-[10px]">Đang bật</span>
                  </div>
                  {user?.role === 'MANAGER' && (
                    <div className="p-4 bg-slate-50/50 dark:bg-zinc-950/10 flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-slate-700 dark:text-zinc-200">Thẩm định chỉ tiêu cấp dưới</h4>
                        <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold mt-0.5">Đánh giá và phản hồi kết quả KPI của tất cả nhân sự thuộc phòng</p>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-650 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-full font-bold text-[10px]">Đang bật</span>
                    </div>
                  )}
                  {user?.role === 'DIRECTOR' && (
                    <div className="p-4 bg-slate-50/50 dark:bg-zinc-950/10 flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-slate-700 dark:text-zinc-200">Thẩm định hiệu suất các phòng ban</h4>
                        <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold mt-0.5">Chốt xếp loại hiệu suất và nhận xét KPI của các phòng ban</p>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-650 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-full font-bold text-[10px]">Đang bật</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ACCOUNT SECURITY & PASSWORD CHANGE */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <h3 className="text-sm font-extrabold uppercase text-slate-800 dark:text-zinc-250 border-b border-slate-100 dark:border-zinc-800 pb-3 flex items-center gap-2">
                <Lock className="w-4.5 h-4.5 text-indigo-500" />
                Đổi Mật Khẩu Bảo Mật
              </h3>

              <form onSubmit={handleChangePassword} className="space-y-5 max-w-lg">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-zinc-400">
                    Mật khẩu hiện tại
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={oldPassword}
                      onChange={e => setOldPassword(e.target.value)}
                      placeholder="Nhập mật khẩu đang sử dụng"
                      className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/30 dark:bg-zinc-900/30 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-555 focus:outline-none dark:text-zinc-100"
                    />
                    <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-zinc-400">
                    Mật khẩu mới
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Nhập mật khẩu mới"
                      className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/30 dark:bg-zinc-900/30 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-555 focus:outline-none dark:text-zinc-100"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  </div>
                  
                  {/* Strength Bar */}
                  {newPassword && (
                    <div className="pt-1.5 space-y-1">
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className="text-slate-400">Độ mạnh mật khẩu:</span>
                        <span className={
                          strength.score <= 2 ? 'text-rose-500' : strength.score <= 4 ? 'text-amber-500' : 'text-emerald-500'
                        }>{strength.text}</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden flex gap-0.5">
                        <div className={`h-full ${strength.color} flex-1 transition-all duration-350`} style={{ opacity: strength.score >= 1 ? 1 : 0 }} />
                        <div className={`h-full ${strength.color} flex-1 transition-all duration-350`} style={{ opacity: strength.score >= 3 ? 1 : 0 }} />
                        <div className={`h-full ${strength.color} flex-1 transition-all duration-350`} style={{ opacity: strength.score >= 5 ? 1 : 0 }} />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-zinc-400">
                    Xác nhận mật khẩu mới
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Xác nhận lại mật khẩu mới"
                      className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/30 dark:bg-zinc-900/30 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-555 focus:outline-none dark:text-zinc-100"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-zinc-850 flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all duration-155 disabled:opacity-55"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Key className="w-4 h-4" />
                    )}
                    Cập nhật mật khẩu
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
