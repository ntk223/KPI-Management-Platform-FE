import React, { useState } from 'react';
import { useAuth } from '../features/auth';

// Types for OKRs/KPIs and Weekly PPP Items
interface OKRItem {
  id: string;
  title: string;
  type: 'company' | 'department' | 'personal';
  progress: number;
  ownerName: string;
  role: 'ADMIN' | 'DIRECTOR' | 'MANAGER' | 'EMPLOYEE';
}

interface PPPItem {
  id: string;
  type: 'PROGRESS' | 'PLAN' | 'PROBLEM';
  content: string;
  okrId?: string; // Associated OKR
  createdAt: string;
}

interface FeedItem {
  id: string;
  userName: string;
  role: 'ADMIN' | 'DIRECTOR' | 'MANAGER' | 'EMPLOYEE';
  avatar: string;
  action: string;
  time: string;
  likes: number;
  hasLiked: boolean;
  comments: string[];
}

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  // OKR State
  const [okrs, setOkrs] = useState<OKRItem[]>([
    {
      id: 'okr-c1',
      title: 'Tăng trưởng 25% doanh số và mở rộng thị trường khu vực phía Nam',
      type: 'company',
      progress: 68,
      ownerName: 'Phạm Thế Vinh',
      role: 'DIRECTOR',
    },
    {
      id: 'okr-d1',
      title: 'Hoàn thiện hệ thống Core API KPI Management & Security Core v1.0',
      type: 'department',
      progress: 75,
      ownerName: 'Trần Minh Quang',
      role: 'MANAGER',
    },
    {
      id: 'okr-d2',
      title: 'Tối ưu hóa UI/UX và tăng điểm số trải nghiệm người dùng lên 90%',
      type: 'department',
      progress: 42,
      ownerName: 'Nguyễn Thu Thảo',
      role: 'EMPLOYEE',
    },
    {
      id: 'okr-p1',
      title: 'Xây dựng module Xác thực phân quyền & Cài đặt hệ thống',
      type: 'personal',
      progress: 90,
      ownerName: 'Trần Minh Quang',
      role: 'MANAGER',
    },
  ]);

  // PPP Board State
  const [pppItems, setPppItems] = useState<PPPItem[]>([
    {
      id: 'ppp-1',
      type: 'PROGRESS',
      content: 'Hoàn thành thiết kế cấu trúc thư mục Feature-Based và cài đặt ban đầu cho Frontend.',
      okrId: 'okr-d1',
      createdAt: 'Thứ 2, 09:30',
    },
    {
      id: 'ppp-2',
      type: 'PROGRESS',
      content: 'Tích hợp thành công DashboardLayout và cấu hình role-based colors cho dự án.',
      okrId: 'okr-p1',
      createdAt: 'Thứ 3, 14:15',
    },
    {
      id: 'ppp-3',
      type: 'PLAN',
      content: 'Thiết kế giao diện và kết nối các nghiệp vụ của Module Quản lý phiếu KPI (kpi-document).',
      okrId: 'okr-d2',
      createdAt: 'Thứ 4, 11:00',
    },
    {
      id: 'ppp-4',
      type: 'PLAN',
      content: 'Viết tài liệu hướng dẫn cấu trúc thư mục và quy trình phát triển cho đội ngũ frontend.',
      createdAt: 'Thứ 5, 08:30',
    },
    {
      id: 'ppp-5',
      type: 'PROBLEM',
      content: 'Lỗi nạp cấu hình PostCSS trên môi trường ES Modules do khai báo module.exports cũ.',
      okrId: 'okr-d1',
      createdAt: 'Thứ 6, 16:45',
    },
  ]);

  // Team Status Feed State
  const [feedItems, setFeedItems] = useState<FeedItem[]>([
    {
      id: 'f-1',
      userName: 'Nguyễn Thu Thảo',
      role: 'EMPLOYEE',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&h=150&q=80',
      action: 'đã hoàn thành bản vẽ UI/UX cho màn hình Báo cáo tiến độ KPI.',
      time: '1 giờ trước',
      likes: 4,
      hasLiked: false,
      comments: ['Giao diện nhìn hiện đại và sạch sẽ lắm Thảo ơi!', 'Tối ưu thêm chế độ Dark Mode nhé.'],
    },
    {
      id: 'f-2',
      userName: 'Nguyễn Hoàng Hải',
      role: 'ADMIN',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80',
      action: 'đã giải quyết vướng mắc về phân quyền API của Manager.',
      time: '3 giờ trước',
      likes: 2,
      hasLiked: true,
      comments: [],
    },
  ]);

  // Form States
  const [newItemText, setNewItemText] = useState('');
  const [newItemType, setNewItemType] = useState<'PROGRESS' | 'PLAN' | 'PROBLEM'>('PLAN');
  const [selectedOkrId, setSelectedOkrId] = useState<string>('');
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  // Role Badge Styling Helper
  const roleStyles: Record<string, string> = {
    ADMIN: 'bg-role-admin/10 text-role-admin border-role-admin/20',
    DIRECTOR: 'bg-role-director/10 text-role-director border-role-director/20',
    MANAGER: 'bg-role-manager/10 text-role-manager border-role-manager/20',
    EMPLOYEE: 'bg-role-employee/10 text-role-employee border-role-employee/20',
  };

  const handleAddPPPItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;

    const newItem: PPPItem = {
      id: 'ppp-' + Date.now(),
      type: newItemType,
      content: newItemText.trim(),
      okrId: selectedOkrId || undefined,
      createdAt: 'Vừa xong',
    };

    setPppItems([newItem, ...pppItems]);
    setNewItemText('');
    setSelectedOkrId('');
  };

  const handleDeletePPP = (id: string) => {
    setPppItems(pppItems.filter(item => item.id !== id));
  };

  const handleTogglePlanToProgress = (id: string) => {
    setPppItems(pppItems.map(item => {
      if (item.id === id && item.type === 'PLAN') {
        return { ...item, type: 'PROGRESS' as const };
      }
      return item;
    }));
  };

  const handleLikeFeed = (id: string) => {
    setFeedItems(feedItems.map(item => {
      if (item.id === id) {
        return {
          ...item,
          likes: item.hasLiked ? item.likes - 1 : item.likes + 1,
          hasLiked: !item.hasLiked,
        };
      }
      return item;
    }));
  };

  const handleAddComment = (feedId: string) => {
    const text = commentInputs[feedId];
    if (!text || !text.trim()) return;

    setFeedItems(feedItems.map(item => {
      if (item.id === feedId) {
        return { ...item, comments: [...item.comments, text.trim()] };
      }
      return item;
    }));

    setCommentInputs({ ...commentInputs, [feedId]: '' });
  };

  const handleUpdateOkrProgress = (id: string, newProgress: number) => {
    setOkrs(okrs.map(okr => {
      if (okr.id === id) {
        return { ...okr, progress: newProgress };
      }
      return okr;
    }));
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-5 pointer-events-none transform translate-x-12">
          <svg className="w-96 h-96" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10H7v-2h10v2zm0 4H7v-2h10v2zm0-8H7V7h10v2z" />
          </svg>
        </div>
        
        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/20 text-blue-300 rounded-full border border-blue-500/30 text-xs font-semibold mb-3">
            🎯 Dashboard truyền cảm hứng từ Weekdone
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
            Bảng Tiến Độ Tuần & OKRs
          </h1>
          <p className="mt-2 text-slate-300 text-sm leading-relaxed">
            Chào mừng quay lại, <span className="font-semibold text-white">{user?.name || 'Thành viên'}</span>. Hãy theo dõi và cập nhật mục tiêu quý của bạn.
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COLUMN 1: Visual Goal Tree & OKRs */}
        <section className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
              </svg>
              Cây Mục Tiêu (OKRs)
            </h3>
            <span className="text-[10px] bg-slate-100 px-2 py-0.75 rounded-full font-bold text-slate-500 uppercase tracking-wide">Q3/2025</span>
          </div>

          <div className="space-y-4">
            {okrs.map((okr) => (
              <div key={okr.id} className="p-3.5 bg-slate-50/60 hover:bg-slate-50 rounded-xl border border-slate-200/70 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                    okr.type === 'company' ? 'bg-indigo-100 text-indigo-700' :
                    okr.type === 'department' ? 'bg-blue-100 text-blue-700' :
                    'bg-emerald-100 text-emerald-700'
                  }`}>
                    {okr.type === 'company' ? '🏢 Công ty' : okr.type === 'department' ? '👥 Phòng ban' : '👤 Cá nhân'}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-500 font-semibold">{okr.ownerName}</span>
                    <span className={`inline-block px-1 py-0.25 text-[8px] font-bold rounded-full border ${roleStyles[okr.role]}`}>
                      {okr.role}
                    </span>
                  </div>
                </div>

                <h4 className="text-xs font-bold text-slate-700 line-clamp-2 mb-3 leading-normal">
                  {okr.title}
                </h4>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-slate-400">Tiến độ hoàn thành:</span>
                    <span className="text-primary">{okr.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden shadow-inner">
                    <div 
                      className="bg-primary h-full rounded-full transition-all duration-500" 
                      style={{ width: `${okr.progress}%` }} 
                    />
                  </div>
                  <div className="pt-2 flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={okr.progress}
                      onChange={(e) => handleUpdateOkrProgress(okr.id, parseInt(e.target.value))}
                      className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <span className="text-[9px] text-slate-400 font-bold whitespace-nowrap">Kéo cập nhật</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* COLUMN 2: Weekly PPP Board */}
        <section className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-bold text-slate-800 text-base pb-3 border-b border-slate-100 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Check-in Tuần Này
            </h3>

            <form onSubmit={handleAddPPPItem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Loại báo cáo</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewItemType('PLAN')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition-all ${
                      newItemType === 'PLAN'
                        ? 'bg-blue-50 text-blue-700 border-blue-300 ring-2 ring-blue-100'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    🔵 Kế hoạch
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewItemType('PROGRESS')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition-all ${
                      newItemType === 'PROGRESS'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-2 ring-emerald-100'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    🟢 Tiến độ
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewItemType('PROBLEM')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition-all ${
                      newItemType === 'PROBLEM'
                        ? 'bg-rose-50 text-rose-700 border-rose-300 ring-2 ring-rose-100'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    🔴 Vướng mắc
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Nội dung chi tiết</label>
                <textarea
                  rows={2}
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  placeholder="Nhập nhiệm vụ hoặc vướng mắc..."
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-xs text-slate-700 bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Liên kết Mục tiêu (OKRs)</label>
                <select
                  value={selectedOkrId}
                  onChange={(e) => setSelectedOkrId(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-xs text-slate-600 bg-slate-50/50"
                >
                  <option value="">-- Chọn OKR liên quan --</option>
                  {okrs.map(okr => (
                    <option key={okr.id} value={okr.id}>
                      [{okr.type === 'company' ? 'Công ty' : okr.type === 'department' ? 'Phòng' : 'Cá nhân'}] {okr.title}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all active:scale-[0.98] shadow-md shadow-slate-900/10"
              >
                Thêm vào Bảng PPP tuần
              </button>
            </form>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-6">
            {/* PROGRESS (🟢) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1.5 border-b border-emerald-100">
                <h4 className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  ĐÃ HOÀN THÀNH (PROGRESS)
                </h4>
                <span className="text-[10px] font-bold text-emerald-700 px-2 py-0.5 bg-emerald-50 rounded-full">
                  {pppItems.filter(item => item.type === 'PROGRESS').length}
                </span>
              </div>
              <div className="space-y-2.5">
                {pppItems.filter(item => item.type === 'PROGRESS').length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic py-2">Chuyên mục trống.</p>
                ) : (
                  pppItems.filter(item => item.type === 'PROGRESS').map((item) => (
                    <div key={item.id} className="p-3 bg-emerald-50/40 border border-emerald-200/50 rounded-xl flex items-start gap-2.5 group relative hover:shadow-sm transition-all">
                      <span className="mt-0.5 text-emerald-600 flex-shrink-0">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-700 leading-relaxed font-medium">{item.content}</p>
                        {item.okrId && (
                          <span className="inline-block mt-1.5 text-[9px] font-semibold text-slate-400 bg-white px-2 py-0.5 border border-slate-200 rounded">
                            🎯 {okrs.find(o => o.id === item.okrId)?.title}
                          </span>
                        )}
                      </div>
                      <button onClick={() => handleDeletePPP(item.id)} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* PLANS (🔵) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1.5 border-b border-blue-100">
                <h4 className="text-xs font-bold text-blue-800 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  KẾ HOẠCH (PLANS)
                </h4>
                <span className="text-[10px] font-bold text-blue-700 px-2 py-0.5 bg-blue-50 rounded-full">
                  {pppItems.filter(item => item.type === 'PLAN').length}
                </span>
              </div>
              <div className="space-y-2.5">
                {pppItems.filter(item => item.type === 'PLAN').length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic py-2">Chuyên mục trống.</p>
                ) : (
                  pppItems.filter(item => item.type === 'PLAN').map((item) => (
                    <div key={item.id} className="p-3 bg-blue-50/30 border border-blue-200/50 rounded-xl flex items-start gap-2.5 group relative hover:shadow-sm transition-all">
                      <button onClick={() => handleTogglePlanToProgress(item.id)} className="mt-0.5 text-blue-400 hover:text-emerald-500 flex-shrink-0 transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><circle cx="12" cy="12" r="9" /></svg>
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-700 leading-relaxed font-medium">{item.content}</p>
                        {item.okrId && (
                          <span className="inline-block mt-1.5 text-[9px] font-semibold text-slate-400 bg-white px-2 py-0.5 border border-slate-200 rounded">
                            🎯 {okrs.find(o => o.id === item.okrId)?.title}
                          </span>
                        )}
                      </div>
                      <button onClick={() => handleDeletePPP(item.id)} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* PROBLEMS (🔴) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1.5 border-b border-rose-100">
                <h4 className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  VƯỚNG MẮC (PROBLEMS)
                </h4>
                <span className="text-[10px] font-bold text-rose-700 px-2 py-0.5 bg-rose-50 rounded-full">
                  {pppItems.filter(item => item.type === 'PROBLEM').length}
                </span>
              </div>
              <div className="space-y-2.5">
                {pppItems.filter(item => item.type === 'PROBLEM').length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic py-2">Chuyên mục trống.</p>
                ) : (
                  pppItems.filter(item => item.type === 'PROBLEM').map((item) => (
                    <div key={item.id} className="p-3 bg-rose-50/30 border border-rose-200/50 rounded-xl flex items-start gap-2.5 group relative hover:shadow-sm transition-all">
                      <span className="mt-0.5 text-rose-500 flex-shrink-0">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-rose-800 leading-relaxed font-semibold">{item.content}</p>
                        {item.okrId && (
                          <span className="inline-block mt-1.5 text-[9px] font-semibold text-slate-400 bg-white px-2 py-0.5 border border-slate-200 rounded">
                            🎯 {okrs.find(o => o.id === item.okrId)?.title}
                          </span>
                        )}
                      </div>
                      <button onClick={() => handleDeletePPP(item.id)} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        {/* COLUMN 3: Team Feed */}
        <section className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
              Hoạt Động Nhóm
            </h3>
            <span className="text-[10px] bg-indigo-50 px-2 py-0.75 rounded-full font-bold text-indigo-600">LIVE FEED</span>
          </div>

          <div className="space-y-5">
            {feedItems.map((item) => (
              <div key={item.id} className="space-y-3 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                <div className="flex gap-3">
                  <img src={item.avatar} alt={item.userName} className="w-9 h-9 rounded-full object-cover border border-slate-200" />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-x-1.5">
                      <span className="text-xs font-bold text-slate-800 truncate">{item.userName}</span>
                      <span className={`px-1 py-0.25 text-[7px] font-extrabold rounded border ${roleStyles[item.role]}`}>
                        {item.role}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{item.action}</p>
                    <span className="text-[9px] text-slate-400 font-semibold">{item.time}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 pl-12 text-xs">
                  <button onClick={() => handleLikeFeed(item.id)} className={`flex items-center gap-1 font-semibold transition-all ${item.hasLiked ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}>
                    <svg className="w-4 h-4" fill={item.hasLiked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>
                    {item.likes} Thích
                  </button>
                  <span className="text-slate-300">|</span>
                  <span className="text-slate-400 font-semibold flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    {item.comments.length} Bình luận
                  </span>
                </div>

                {item.comments.length > 0 && (
                  <div className="pl-12 space-y-1.5 pt-1">
                    {item.comments.map((comment, index) => (
                      <div key={index} className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-[11px] leading-relaxed text-slate-600">
                        <span className="font-bold text-slate-700 mr-1">Đồng nghiệp:</span>{comment}
                      </div>
                    ))}
                  </div>
                )}

                <div className="pl-12 pt-1 flex gap-2">
                  <input
                    type="text"
                    placeholder="Viết phản hồi..."
                    value={commentInputs[item.id] || ''}
                    onChange={(e) => setCommentInputs({ ...commentInputs, [item.id]: e.target.value })}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment(item.id); }}
                    className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-[11px] focus:outline-none focus:ring-1 focus:ring-primary bg-slate-50/50"
                  />
                  <button onClick={() => handleAddComment(item.id)} className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[10px]">Gửi</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
