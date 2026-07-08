import React, { useState, useEffect, useMemo } from 'react';
import { DirectorDashboard } from './DirectorDashboard';
import { catalogService } from '../../admin-catalog/services/catalogService';
import { 
  Users, 
  FolderTree, 
  BookOpen, 
  Calendar, 
  ShieldAlert, 
  Settings, 
  ChevronRight, 
  Activity, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight, 
  AlertCircle, 
  FileSpreadsheet, 
  RefreshCw,
  Info,
  Target
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface AdminDashboardProps {
  user: any;
  cycles: any[];
  departments: any[];
  currentDocs: any[];
  recentLogs: any[];
  selectedCycleId: number | '';
  setSelectedCycleId: (val: number | '') => void;
  isLoading: boolean;
  loadDashboardData: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = (props) => {
  const { 
    cycles, 
    currentDocs, 
    recentLogs, 
    selectedCycleId, 
    setSelectedCycleId, 
    loadDashboardData 
  } = props;

  const [activeTab, setActiveTab] = useState<'system' | 'performance'>('system');
  
  // System Statistics State
  const [totalEmployees, setTotalEmployees] = useState<number>(0);
  const [totalDepartments, setTotalDepartments] = useState<number>(0);
  const [totalTemplates, setTotalTemplates] = useState<number>(0);
  const [totalCategories, setTotalCategories] = useState<number>(0);
  const [isLoadingCounts, setIsLoadingCounts] = useState<boolean>(false);
  const [localCycles, setLocalCycles] = useState<any[]>(cycles);

  // Transition confirmation states
  const [confirmStatus, setConfirmStatus] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  // Load local cycles when props.cycles changes
  useEffect(() => {
    setLocalCycles(cycles);
  }, [cycles]);

  // Fetch counts from real DB
  const loadSystemStats = async () => {
    setIsLoadingCounts(true);
    try {
      const [empCount, deptCount, templateCount, catCount] = await Promise.all([
        catalogService.fetchCount('/employees'),
        catalogService.fetchCount('/departments'),
        catalogService.fetchCount('/kpi-templates'),
        catalogService.fetchCount('/kpi-categories')
      ]);
      setTotalEmployees(empCount);
      setTotalDepartments(deptCount);
      setTotalTemplates(templateCount);
      setTotalCategories(catCount);
    } catch (err) {
      console.error('Failed to load system stats:', err);
    } finally {
      setIsLoadingCounts(false);
    }
  };

  useEffect(() => {
    loadSystemStats();
  }, []);

  // Compute selected cycle details
  const activeCycleObj = useMemo(() => {
    return localCycles.find(c => c.status === 'ACTIVE') || localCycles[0];
  }, [localCycles]);

  const selectedCycleObj = useMemo(() => {
    if (!selectedCycleId) return null;
    return localCycles.find(c => c.id === Number(selectedCycleId));
  }, [selectedCycleId, localCycles]);

  // Document Status chart data calculation
  const docStatusData = useMemo(() => {
    const statusCounts = {
      DRAFT: 0,
      PENDING_APPROVAL: 0,
      APPROVED: 0,
      REJECTED: 0,
      CLOSED: 0
    };

    currentDocs.forEach((doc: any) => {
      const status = doc.status as keyof typeof statusCounts;
      if (status in statusCounts) {
        statusCounts[status]++;
      }
    });

    return [
      { name: 'Bản nháp', value: statusCounts.DRAFT, color: '#94a3b8' },
      { name: 'Chờ phê duyệt', value: statusCounts.PENDING_APPROVAL, color: '#f59e0b' },
      { name: 'Đã phê duyệt', value: statusCounts.APPROVED, color: '#10b981' },
      { name: 'Bị từ chối', value: statusCounts.REJECTED, color: '#ef4444' },
      { name: 'Đã đóng', value: statusCounts.CLOSED, color: '#6366f1' }
    ].filter(item => item.value > 0); // only show statuses with documents
  }, [currentDocs]);

  // Handle cycle status transition
  const handleTransitionCycle = async (newStatus: string) => {
    if (!selectedCycleObj) return;
    setIsTransitioning(true);
    try {
      const updated = await catalogService.changeCycleStatus(selectedCycleObj.id, newStatus);
      // Update local state for cycle list
      setLocalCycles(prev => prev.map(c => c.id === updated.id ? updated : c));
      setConfirmStatus(null);
      loadDashboardData();
    } catch (err) {
      console.error('Failed to change cycle status:', err);
    } finally {
      setIsTransitioning(false);
    }
  };



  const cycleStatusTextMap: Record<string, string> = {
    PLANNING: 'Lập kế hoạch',
    ACTIVE: 'Đang hoạt động (Hiện tại)',
    EVALUATING: 'Đang đánh giá',
    CLOSED: 'Đã kết thúc',
  };

  const statusStyles = useMemo(() => {
    if (!selectedCycleObj) return { bg: 'bg-slate-50 border-slate-200 dark:bg-zinc-850 dark:border-zinc-800', text: 'text-slate-700 dark:text-zinc-300', badge: 'bg-slate-100 text-slate-800' };
    switch (selectedCycleObj.status) {
      case 'ACTIVE':
        return {
          bg: 'bg-gradient-to-br from-emerald-50/50 via-white to-white dark:from-emerald-950/10 dark:to-zinc-900 border-emerald-250 dark:border-emerald-900/50 shadow-[0_4px_12px_rgba(16,185,129,0.02)]',
          text: 'text-emerald-700 dark:text-emerald-400',
          badge: 'bg-emerald-50/80 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200'
        };
      case 'PLANNING':
        return {
          bg: 'bg-gradient-to-br from-indigo-50/50 via-white to-white dark:from-indigo-950/10 dark:to-zinc-900 border-indigo-250 dark:border-indigo-900/50 shadow-[0_4px_12px_rgba(99,102,241,0.02)]',
          text: 'text-indigo-700 dark:text-indigo-400',
          badge: 'bg-indigo-50/80 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200'
        };
      case 'EVALUATING':
        return {
          bg: 'bg-gradient-to-br from-amber-50/50 via-white to-white dark:from-amber-950/10 dark:to-zinc-900 border-amber-250 dark:border-amber-900/50 shadow-[0_4px_12px_rgba(245,158,11,0.02)]',
          text: 'text-amber-700 dark:text-amber-400',
          badge: 'bg-amber-50/80 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200'
        };
      case 'CLOSED':
        return {
          bg: 'bg-gradient-to-br from-rose-50/50 via-white to-white dark:from-rose-950/10 dark:to-zinc-900 border-rose-250 dark:border-rose-900/50 shadow-[0_4px_12px_rgba(239,68,68,0.02)]',
          text: 'text-rose-700 dark:text-rose-400',
          badge: 'bg-rose-50/80 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200'
        };
      default:
        return { bg: 'bg-slate-50 border-slate-200 dark:bg-zinc-850 dark:border-zinc-800', text: 'text-slate-700 dark:text-zinc-300', badge: 'bg-slate-100 text-slate-800' };
    }
  }, [selectedCycleObj]);

  return (
    <div className="space-y-6">
      {/* Administrator top ribbon */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/20 p-5 rounded-2xl text-white shadow-[0_4px_25px_rgba(99,102,241,0.12)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        {/* Glow Spheres */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl pointer-events-none translate-y-1/3 -translate-x-1/4"></div>

        <div className="flex items-center gap-3.5 relative z-10">
          <div className="p-2.5 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl shadow-md shadow-amber-500/20">
            <ShieldAlert className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-100 flex items-center gap-2">
              <span>Quyền Quản trị viên</span>
              <span className="text-[9px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 uppercase font-black">Admin Mode</span>
            </h3>
            <p className="text-xs text-slate-350 font-medium mt-1">
              Hệ thống quản lý chu kỳ đánh giá, phân cấp tổ chức và cấu hình danh mục toàn diện.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 relative z-10 w-full md:w-auto shrink-0">
          <button
            onClick={() => setActiveTab(activeTab === 'system' ? 'performance' : 'system')}
            className="flex-1 md:flex-none px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/10 hover:border-white/20 backdrop-blur-md rounded-xl text-xs font-extrabold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Activity className="w-4 h-4 text-indigo-400" />
            {activeTab === 'system' ? 'Xem Dashboard Hiệu Suất' : 'Xem Dashboard Hệ Thống'}
          </button>
          <a
            href="/admin/catalog"
            className="flex-1 md:flex-none px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-amber-500/10 flex items-center justify-center gap-1.5 uppercase tracking-wide cursor-pointer border border-amber-450"
          >
            <Settings className="w-3.5 h-3.5" />
            Cấu hình Danh mục
          </a>
        </div>
      </div>

      {activeTab === 'system' ? (
        <div className="space-y-6">
          {/* Stats Cards Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Staff Card */}
            <div className="bg-gradient-to-br from-blue-50/40 via-white to-white dark:from-blue-950/10 dark:to-zinc-900 border-l-4 border-l-blue-500 border border-slate-200 dark:border-zinc-800 shadow-[0_4px_12px_rgba(59,130,246,0.03)] hover:shadow-md hover:border-l-blue-600 transition-all rounded-2xl p-5 flex items-center gap-4">
              <div className="w-11 h-11 bg-blue-50 dark:bg-blue-950/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30 shadow-sm shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-wider block">Nhân sự</span>
                <span className="text-xl font-black text-slate-800 dark:text-zinc-100 mt-0.5 block truncate">
                  {isLoadingCounts ? '...' : totalEmployees}
                </span>
              </div>
            </div>

            {/* Department Card */}
            <div className="bg-gradient-to-br from-emerald-50/40 via-white to-white dark:from-emerald-950/10 dark:to-zinc-900 border-l-4 border-l-emerald-500 border border-slate-200 dark:border-zinc-800 shadow-[0_4px_12px_rgba(16,185,129,0.03)] hover:shadow-md hover:border-l-emerald-600 transition-all rounded-2xl p-5 flex items-center gap-4">
              <div className="w-11 h-11 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-900/30 shadow-sm shrink-0">
                <FolderTree className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-wider block">Phòng ban</span>
                <span className="text-xl font-black text-slate-800 dark:text-zinc-100 mt-0.5 block truncate">
                  {isLoadingCounts ? '...' : totalDepartments}
                </span>
              </div>
            </div>

            {/* KPI Template Card */}
            <div className="bg-gradient-to-br from-amber-50/40 via-white to-white dark:from-amber-950/10 dark:to-zinc-900 border-l-4 border-l-amber-500 border border-slate-200 dark:border-zinc-800 shadow-[0_4px_12px_rgba(245,158,11,0.03)] hover:shadow-md hover:border-l-amber-600 transition-all rounded-2xl p-5 flex items-center gap-4">
              <div className="w-11 h-11 bg-amber-50 dark:bg-amber-950/30 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-455 border border-amber-100 dark:border-amber-900/30 shadow-sm shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-wider block">KPI mẫu</span>
                <span className="text-xl font-black text-slate-800 dark:text-zinc-100 mt-0.5 block flex items-baseline gap-1 truncate">
                  {isLoadingCounts ? '...' : totalTemplates}
                  <span className="text-[9px] font-semibold text-slate-405 dark:text-zinc-450 lowercase">({totalCategories} nhóm)</span>
                </span>
              </div>
            </div>

            {/* Active Cycle Card */}
            <div className="bg-gradient-to-br from-purple-50/40 via-white to-white dark:from-purple-950/10 dark:to-zinc-900 border-l-4 border-l-purple-500 border border-slate-200 dark:border-zinc-800 shadow-[0_4px_12px_rgba(139,92,246,0.03)] hover:shadow-md hover:border-l-purple-600 transition-all rounded-2xl p-5 flex items-center gap-4">
              <div className="w-11 h-11 bg-purple-50 dark:bg-purple-950/30 rounded-xl flex items-center justify-center text-purple-650 dark:text-purple-400 border border-purple-100 dark:border-purple-900/30 shadow-sm shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-wider block">Chu kỳ hiện tại</span>
                <span className="text-xs font-black text-slate-800 dark:text-zinc-200 mt-1.5 block truncate">
                  {activeCycleObj ? activeCycleObj.name : 'Chưa thiết lập'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Cycle and operations - Left span 7 */}
            <div className="lg:col-span-7 space-y-6">
              {/* Cycle Management Panel */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 dark:bg-zinc-900 dark:border-zinc-800">
                <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-zinc-850 mb-5">
                  <h3 className="font-bold text-slate-800 dark:text-zinc-200 text-sm flex items-center gap-2">
                    <span className="p-1.5 bg-indigo-50 dark:bg-indigo-950/50 rounded-lg text-indigo-650 dark:text-indigo-400">
                      <RefreshCw className="w-4 h-4" />
                    </span>
                    Quản lý chu kỳ đánh giá KPI
                  </h3>
                  <div className="flex items-center gap-2 bg-slate-105 p-1 rounded-xl border border-slate-200/80 dark:bg-zinc-800 dark:border-zinc-700">
                    <span className="text-[9px] font-black uppercase text-slate-450 dark:text-zinc-400 px-1.5">Lọc chu kỳ:</span>
                    <select
                      value={selectedCycleId}
                      onChange={e => setSelectedCycleId(e.target.value ? Number(e.target.value) : '')}
                      className="bg-transparent text-xs font-bold text-slate-750 dark:text-zinc-200 outline-none border-none pr-6 cursor-pointer"
                    >
                      <option value="">-- Chọn chu kỳ --</option>
                      {localCycles.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.status === 'ACTIVE' ? '(Hiện tại)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {selectedCycleObj ? (
                  <div className="space-y-5">
                    <div className={`${statusStyles.bg} p-5 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all duration-300`}>
                      <div>
                        <div className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Chu kỳ đang quản lý</div>
                        <h4 className="font-black text-slate-800 dark:text-zinc-100 text-base mt-0.5">{selectedCycleObj.name}</h4>
                        <div className="flex items-center gap-2 mt-2.5">
                          <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400">Trạng thái:</span>
                          <span className={`px-3 py-0.5 rounded-full text-[9px] font-black uppercase border tracking-wider ${statusStyles.badge}`}>
                            {cycleStatusTextMap[selectedCycleObj.status] || selectedCycleObj.status}
                          </span>
                        </div>
                      </div>

                      {/* State transition triggers */}
                      <div className="flex flex-wrap gap-2 shrink-0">
                        {selectedCycleObj.status === 'PLANNING' && (
                          <button
                            onClick={() => setConfirmStatus('ACTIVE')}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-sm hover:shadow-emerald-500/10 cursor-pointer border border-emerald-650"
                          >
                            Kích hoạt chu kỳ
                          </button>
                        )}
                        {selectedCycleObj.status === 'ACTIVE' && (
                          <button
                            onClick={() => setConfirmStatus('EVALUATING')}
                            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black transition-all shadow-sm hover:shadow-amber-500/10 cursor-pointer border border-amber-550"
                          >
                            Mở cổng đánh giá
                          </button>
                        )}
                        {selectedCycleObj.status === 'EVALUATING' && (
                          <button
                            onClick={() => setConfirmStatus('CLOSED')}
                            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition-all shadow-sm hover:shadow-rose-500/10 cursor-pointer border border-rose-650"
                          >
                            Đóng cổng / Kết thúc
                          </button>
                        )}
                        {selectedCycleObj.status === 'CLOSED' && (
                          <span className="text-xs font-bold text-slate-400 dark:text-zinc-500 italic flex items-center gap-1">
                            <Info className="w-3.5 h-3.5 text-slate-400" /> Chu kỳ đã kết thúc hoàn toàn
                          </span>
                        )}
                      </div>
                    </div>

                    {/* State-based inline confirmation dialog */}
                    {confirmStatus && (
                      <div className="bg-amber-50/30 border border-amber-200 p-4 rounded-xl space-y-3 dark:bg-amber-950/10 dark:border-amber-900/20 animate-[fadeIn_0.15s_ease-out]">
                        <h4 className="font-extrabold text-xs text-amber-850 dark:text-amber-300 flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 text-amber-600" />
                          Xác nhận chuyển trạng thái chu kỳ?
                        </h4>
                        <p className="text-[11px] text-slate-650 dark:text-zinc-400 leading-relaxed font-semibold">
                          Hệ thống sẽ chuyển chu kỳ đánh giá sang trạng thái <span className="font-bold text-amber-800 dark:text-amber-400">"{cycleStatusTextMap[confirmStatus]}"</span>.
                          Hành động này ảnh hưởng trực tiếp đến quyền cập nhật tiến độ, duyệt và chấm điểm tự đánh giá của toàn bộ nhân viên.
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => handleTransitionCycle(confirmStatus)}
                            disabled={isTransitioning}
                            className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-extrabold shadow-sm cursor-pointer transition-colors disabled:opacity-50"
                          >
                            {isTransitioning ? 'Đang cập nhật...' : 'Xác nhận thay đổi'}
                          </button>
                          <button
                            onClick={() => setConfirmStatus(null)}
                            disabled={isTransitioning}
                            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold cursor-pointer transition-colors dark:bg-zinc-800 dark:text-zinc-300"
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-400 italic text-xs">
                    Vui lòng chọn hoặc cấu hình chu kỳ trong danh mục để quản lý.
                  </div>
                )}
              </div>

              {/* Quick links configurations */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 dark:bg-zinc-900 dark:border-zinc-800">
                <h3 className="font-bold text-slate-800 dark:text-zinc-200 text-sm flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-zinc-850 mb-5">
                  <span className="p-1.5 bg-indigo-50 dark:bg-indigo-950/50 rounded-lg text-indigo-650 dark:text-indigo-400">
                    <Settings className="w-4 h-4" />
                  </span>
                  Lối tắt Cấu hình & Quản trị nhanh
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <a
                    href="/admin/catalog"
                    className="p-4 bg-slate-50 hover:bg-indigo-50/20 border border-slate-150 hover:border-indigo-300 rounded-xl transition-all group flex items-start justify-between dark:bg-zinc-850 dark:border-zinc-800 dark:hover:bg-indigo-950/15"
                  >
                    <div className="flex gap-3 min-w-0">
                      <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-100/80 dark:group-hover:bg-indigo-900/30 transition-colors shrink-0">
                        <FolderTree className="w-4 h-4" />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <h4 className="font-bold text-xs text-slate-800 dark:text-zinc-200 group-hover:text-indigo-750 dark:group-hover:text-indigo-400">Danh mục hệ thống</h4>
                        <p className="text-[10px] text-slate-450 dark:text-zinc-400 truncate">Chu kỳ, phòng ban, chức vụ, chỉ tiêu mẫu.</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform mt-2" />
                  </a>

                  <a
                    href="/org"
                    className="p-4 bg-slate-50 hover:bg-emerald-50/20 border border-slate-150 hover:border-emerald-300 rounded-xl transition-all group flex items-start justify-between dark:bg-zinc-850 dark:border-zinc-800 dark:hover:bg-emerald-950/15"
                  >
                    <div className="flex gap-3 min-w-0">
                      <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg text-emerald-600 dark:text-emerald-450 group-hover:bg-emerald-100/80 dark:group-hover:bg-emerald-900/30 transition-colors shrink-0">
                        <Users className="w-4 h-4" />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <h4 className="font-bold text-xs text-slate-800 dark:text-zinc-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-400">Sơ đồ Tổ chức</h4>
                        <p className="text-[10px] text-slate-450 dark:text-zinc-400 truncate">Xem cây sơ đồ phòng ban và phân cấp nhân sự.</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform mt-2" />
                  </a>

                  <a
                    href="/kpis/company"
                    className="p-4 bg-slate-50 hover:bg-amber-50/20 border border-slate-150 hover:border-amber-300 rounded-xl transition-all group flex items-start justify-between dark:bg-zinc-850 dark:border-zinc-800 dark:hover:bg-amber-950/15"
                  >
                    <div className="flex gap-3 min-w-0">
                      <div className="p-2 bg-amber-50 dark:bg-amber-950/40 rounded-lg text-amber-600 dark:text-amber-450 group-hover:bg-amber-100/80 dark:group-hover:bg-amber-900/30 transition-colors shrink-0">
                        <Target className="w-4 h-4" />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <h4 className="font-bold text-xs text-slate-800 dark:text-zinc-200 group-hover:text-amber-700 dark:group-hover:text-amber-400">KPI cấp Công ty</h4>
                        <p className="text-[10px] text-slate-450 dark:text-zinc-400 truncate">Theo dõi chỉ tiêu và tiến độ cấp giám đốc.</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform mt-2" />
                  </a>

                  <a
                    href="/tracking-logs"
                    className="p-4 bg-slate-50 hover:bg-purple-50/20 border border-slate-150 hover:border-purple-300 rounded-xl transition-all group flex items-start justify-between dark:bg-zinc-850 dark:border-zinc-800 dark:hover:bg-purple-950/15"
                  >
                    <div className="flex gap-3 min-w-0">
                      <div className="p-2 bg-purple-50 dark:bg-purple-950/40 rounded-lg text-purple-650 dark:text-purple-400 group-hover:bg-purple-100/80 dark:group-hover:bg-purple-900/30 transition-colors shrink-0">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <h4 className="font-bold text-xs text-slate-800 dark:text-zinc-200 group-hover:text-purple-700 dark:group-hover:text-purple-400">Nhật ký tiến độ</h4>
                        <p className="text-[10px] text-slate-450 dark:text-zinc-400 truncate">Xem toàn bộ lịch sử thay đổi số liệu thực tế.</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform mt-2" />
                  </a>
                </div>
              </div>
            </div>

            {/* Document stats - Right span 5 */}
            <div className="lg:col-span-5 space-y-6">
              {/* Document status stats */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 dark:bg-zinc-900 dark:border-zinc-800 flex flex-col min-h-[300px]">
                <h3 className="font-bold text-slate-800 dark:text-zinc-200 text-sm flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-zinc-850 mb-5">
                  <span className="p-1.5 bg-indigo-50 dark:bg-indigo-950/50 rounded-lg text-indigo-650 dark:text-indigo-400">
                    <FileSpreadsheet className="w-4.5 h-4.5" />
                  </span>
                  Trạng thái Phiếu KPI chu kỳ này
                </h3>

                {currentDocs.length > 0 ? (
                  <div className="flex-1 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="w-full sm:w-1/2 h-44">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={docStatusData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {docStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              fontSize: '11px', 
                              borderRadius: '8px', 
                              backgroundColor: '#1f2937', 
                              color: '#fff',
                              border: 'none'
                            }} 
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="w-full sm:w-1/2 space-y-2">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Tổng cộng: {currentDocs.length} phiếu</div>
                      {docStatusData.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-zinc-300">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                            <span>{item.name}</span>
                          </div>
                          <span className="font-extrabold">{item.value} phiếu ({Math.round(item.value / currentDocs.length * 100)}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400 italic text-xs">
                    Không tìm thấy phiếu KPI nào được tạo trong chu kỳ này.
                  </div>
                )}
              </div>

              {/* Recent tracking activities */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 dark:bg-zinc-900 dark:border-zinc-800">
                <h3 className="font-bold text-slate-800 dark:text-zinc-200 text-sm flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-zinc-850 mb-5">
                  <span className="p-1.5 bg-indigo-50 dark:bg-indigo-950/50 rounded-lg text-indigo-650 dark:text-indigo-400">
                    <Clock className="w-4.5 h-4.5" />
                  </span>
                  Nhật ký cập nhật toàn công ty
                </h3>

                {recentLogs.length > 0 ? (
                  <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
                    {recentLogs.slice(0, 5).map((log: any, idx: number) => {
                      const isUp = log.valueDelta >= 0;
                      return (
                        <div 
                          key={log.id || idx} 
                          className={`flex gap-3.5 text-xs border border-slate-100 dark:border-zinc-850 border-l-4 rounded-xl p-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.015)] transition-all ${
                            isUp 
                              ? 'bg-gradient-to-r from-emerald-50/20 via-white to-white dark:from-emerald-950/5 dark:to-zinc-900/50 border-l-emerald-500 hover:border-l-emerald-600' 
                              : 'bg-gradient-to-r from-rose-50/20 via-white to-white dark:from-rose-950/5 dark:to-zinc-900/50 border-l-rose-500 hover:border-l-rose-600'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                            isUp 
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30' 
                              : 'bg-rose-50 text-rose-600 dark:bg-rose-950/30'
                          }`}>
                            {isUp ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-slate-800 dark:text-zinc-200 truncate">
                                {log.kpiItemName || log.kpiItem?.name || `Chỉ tiêu #${log.kpiItemId}`}
                              </span>
                              <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-bold whitespace-nowrap shrink-0 ml-2">
                                {new Date(log.createdAt).toLocaleDateString('vi-VN')}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium mt-1">
                              Người cập nhật: <span className="font-bold text-slate-700 dark:text-zinc-300">{log.employeeName || `Nhân viên #${log.employeeId}`}</span>
                            </div>
                            <div className="text-[10px] text-slate-450 dark:text-zinc-500 mt-1 border-t border-slate-100 dark:border-zinc-800/40 pt-1.5 flex items-center justify-between flex-wrap gap-1">
                              <div>
                                Giá trị: <span className="font-bold text-slate-500">{log.valueBefore}</span> → <span className="font-black text-indigo-600 dark:text-indigo-400">{log.valueAfter}</span>
                              </div>
                              {log.notes && <span className="italic text-slate-400 block truncate max-w-[200px]">"{log.notes}"</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400 italic text-xs">
                    Chưa ghi nhận hoạt động cập nhật tiến độ nào gần đây.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <DirectorDashboard {...props} />
      )}
    </div>
  );
};

export default AdminDashboard;
