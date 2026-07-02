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
  Info
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

  // Status mapping colors & texts
  const cycleStatusColorMap: Record<string, string> = {
    PLANNING: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700',
    ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/40',
    EVALUATING: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/40',
    CLOSED: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/40',
  };

  const cycleStatusTextMap: Record<string, string> = {
    PLANNING: 'Lập kế hoạch',
    ACTIVE: 'Đang hoạt động (Hiện tại)',
    EVALUATING: 'Đang đánh giá',
    CLOSED: 'Đã kết thúc',
  };

  return (
    <div className="space-y-6">
      {/* Administrator top ribbon */}
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 dark:from-amber-600/30 dark:to-amber-750/30 border border-amber-200/50 dark:border-amber-900/40 p-4.5 rounded-2xl text-white dark:text-amber-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-xl">
            <ShieldAlert className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm uppercase tracking-wider">🔒 Quyền Quản trị viên (Administrator Mode)</h3>
            <p className="text-xs text-white/90 font-medium mt-0.5">
              Bạn có toàn quyền truy cập cấu hình hệ thống, quản lý danh mục và xem tiến độ đánh giá.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveTab(activeTab === 'system' ? 'performance' : 'system')}
            className="px-4 py-2 bg-white text-slate-800 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-705"
          >
            <Activity className="w-4 h-4 text-amber-550" />
            {activeTab === 'system' ? 'Xem Dashboard Hiệu Suất' : 'Xem Dashboard Hệ Thống'}
          </button>
          <a
            href="/admin/catalog"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-950 text-white rounded-xl text-xs font-extrabold transition-all shadow-md flex items-center gap-1.5 uppercase tracking-wide cursor-pointer"
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
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-all dark:bg-zinc-900 dark:border-zinc-800">
              <div className="w-11 h-11 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl flex items-center justify-center text-indigo-650 dark:text-indigo-400">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nhân sự</span>
                <span className="text-xl font-black text-slate-800 dark:text-zinc-100 mt-0.5 block">
                  {isLoadingCounts ? '...' : totalEmployees}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-all dark:bg-zinc-900 dark:border-zinc-800">
              <div className="w-11 h-11 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl flex items-center justify-center text-emerald-650 dark:text-emerald-400">
                <FolderTree className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Phòng ban</span>
                <span className="text-xl font-black text-slate-800 dark:text-zinc-100 mt-0.5 block">
                  {isLoadingCounts ? '...' : totalDepartments}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-all dark:bg-zinc-900 dark:border-zinc-800">
              <div className="w-11 h-11 bg-amber-50 dark:bg-amber-950/30 rounded-xl flex items-center justify-center text-amber-650 dark:text-amber-400">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">KPI mẫu</span>
                <span className="text-xl font-black text-slate-800 dark:text-zinc-100 mt-0.5 block flex items-baseline gap-1">
                  {isLoadingCounts ? '...' : totalTemplates}
                  <span className="text-[10px] font-semibold text-slate-450 dark:text-zinc-400 lowercase">({totalCategories} nhóm)</span>
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-all dark:bg-zinc-900 dark:border-zinc-800">
              <div className="w-11 h-11 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl flex items-center justify-center text-indigo-650 dark:text-indigo-400">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Chu kỳ hiện tại</span>
                <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 mt-1 block truncate max-w-[150px]">
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
                <div className="flex justify-between items-center pb-3.5 border-b border-slate-100 dark:border-zinc-850 mb-5">
                  <h3 className="font-bold text-slate-800 dark:text-zinc-200 text-sm flex items-center gap-2">
                    <RefreshCw className="w-4.5 h-4.5 text-indigo-650" />
                    Quản lý chu kỳ đánh giá KPI
                  </h3>
                  <div className="flex items-center gap-2 bg-slate-105 p-1 rounded-lg border border-slate-200 dark:bg-zinc-800 dark:border-zinc-700">
                    <span className="text-[9px] font-extrabold uppercase text-slate-450 px-1.5">Chu kỳ lọc:</span>
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
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 dark:bg-zinc-850 p-4.5 rounded-xl border border-slate-150 dark:border-zinc-800">
                      <div>
                        <div className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Chu kỳ đã chọn</div>
                        <h4 className="font-black text-slate-800 dark:text-zinc-200 text-sm mt-0.5">{selectedCycleObj.name}</h4>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] font-bold text-slate-500">Trạng thái:</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${cycleStatusColorMap[selectedCycleObj.status] || ''}`}>
                            {cycleStatusTextMap[selectedCycleObj.status] || selectedCycleObj.status}
                          </span>
                        </div>
                      </div>

                      {/* State transition triggers */}
                      <div className="flex flex-wrap gap-2">
                        {selectedCycleObj.status === 'PLANNING' && (
                          <button
                            onClick={() => setConfirmStatus('ACTIVE')}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
                          >
                            Kích hoạt chu kỳ
                          </button>
                        )}
                        {selectedCycleObj.status === 'ACTIVE' && (
                          <button
                            onClick={() => setConfirmStatus('EVALUATING')}
                            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
                          >
                            Mở cổng đánh giá
                          </button>
                        )}
                        {selectedCycleObj.status === 'EVALUATING' && (
                          <button
                            onClick={() => setConfirmStatus('CLOSED')}
                            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
                          >
                            Đóng cổng / Kết thúc
                          </button>
                        )}
                        {selectedCycleObj.status === 'CLOSED' && (
                          <span className="text-xs font-medium text-slate-400 italic flex items-center gap-1">
                            <Info className="w-3.5 h-3.5" /> Chu kỳ đã đóng hoàn toàn
                          </span>
                        )}
                      </div>
                    </div>

                    {/* State-based inline confirmation dialog */}
                    {confirmStatus && (
                      <div className="bg-amber-50/50 border border-amber-250 p-4 rounded-xl space-y-3 dark:bg-amber-950/10 dark:border-amber-900/30 animate-[fadeIn_0.15s_ease-out]">
                        <h4 className="font-extrabold text-xs text-amber-850 dark:text-amber-300 flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 text-amber-650" />
                          Xác nhận chuyển trạng thái chu kỳ?
                        </h4>
                        <p className="text-[11px] text-slate-650 dark:text-zinc-400 leading-relaxed font-semibold">
                          Bạn đang thực hiện chuyển chu kỳ sang trạng thái <span className="font-bold text-amber-800 dark:text-amber-400">"{cycleStatusTextMap[confirmStatus]}"</span>.
                          Hành động này ảnh hưởng trực tiếp đến quyền đề xuất, cập nhật tiến độ hoặc đánh giá KPI của toàn bộ nhân sự trên hệ thống.
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => handleTransitionCycle(confirmStatus)}
                            disabled={isTransitioning}
                            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-extrabold shadow-sm cursor-pointer transition-colors disabled:opacity-50"
                          >
                            {isTransitioning ? 'Đang cập nhật...' : 'Xác nhận thay đổi'}
                          </button>
                          <button
                            onClick={() => setConfirmStatus(null)}
                            disabled={isTransitioning}
                            className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-350 text-slate-800 rounded-lg text-xs font-bold cursor-pointer transition-colors dark:bg-zinc-800 dark:text-zinc-300"
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
                <h3 className="font-bold text-slate-800 dark:text-zinc-200 text-sm flex items-center gap-2 pb-3.5 border-b border-slate-100 dark:border-zinc-850 mb-5">
                  <Settings className="w-4.5 h-4.5 text-indigo-650" />
                  Lối tắt Cấu hình & Quản trị nhanh
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <a
                    href="/admin/catalog"
                    className="p-4 bg-slate-50 hover:bg-indigo-50/40 border border-slate-150 hover:border-indigo-200 rounded-xl transition-all group flex items-start justify-between dark:bg-zinc-850 dark:border-zinc-800 dark:hover:bg-zinc-800"
                  >
                    <div className="space-y-1">
                      <h4 className="font-bold text-xs text-slate-800 dark:text-zinc-200 group-hover:text-indigo-700 dark:group-hover:text-indigo-400">Danh mục hệ thống</h4>
                      <p className="text-[10px] text-slate-450">Quản lý Chu kỳ, Phòng ban, Chức vụ, Chỉ tiêu mẫu.</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </a>

                  <a
                    href="/org"
                    className="p-4 bg-slate-50 hover:bg-indigo-50/40 border border-slate-150 hover:border-indigo-200 rounded-xl transition-all group flex items-start justify-between dark:bg-zinc-850 dark:border-zinc-800 dark:hover:bg-zinc-800"
                  >
                    <div className="space-y-1">
                      <h4 className="font-bold text-xs text-slate-800 dark:text-zinc-200 group-hover:text-indigo-700 dark:group-hover:text-indigo-400">Sơ đồ Tổ chức</h4>
                      <p className="text-[10px] text-slate-450">Xem cây sơ đồ phòng ban và cơ cấu phân cấp nhân sự.</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </a>

                  <a
                    href="/kpis/company"
                    className="p-4 bg-slate-50 hover:bg-indigo-50/40 border border-slate-150 hover:border-indigo-200 rounded-xl transition-all group flex items-start justify-between dark:bg-zinc-850 dark:border-zinc-800 dark:hover:bg-zinc-800"
                  >
                    <div className="space-y-1">
                      <h4 className="font-bold text-xs text-slate-800 dark:text-zinc-200 group-hover:text-indigo-700 dark:group-hover:text-indigo-400">KPI cấp Công ty</h4>
                      <p className="text-[10px] text-slate-450">Kiểm duyệt, theo dõi tiến trình và chỉ tiêu của ban giám đốc.</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </a>

                  <a
                    href="/tracking-logs"
                    className="p-4 bg-slate-50 hover:bg-indigo-50/40 border border-slate-150 hover:border-indigo-200 rounded-xl transition-all group flex items-start justify-between dark:bg-zinc-850 dark:border-zinc-800 dark:hover:bg-zinc-800"
                  >
                    <div className="space-y-1">
                      <h4 className="font-bold text-xs text-slate-800 dark:text-zinc-200 group-hover:text-indigo-700 dark:group-hover:text-indigo-400">Nhật ký tiến độ</h4>
                      <p className="text-[10px] text-slate-450">Tra cứu lịch sử cập nhật số liệu thực tế của toàn nhân viên.</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </a>
                </div>
              </div>
            </div>

            {/* Document stats - Right span 5 */}
            <div className="lg:col-span-5 space-y-6">
              {/* Document status stats */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 dark:bg-zinc-900 dark:border-zinc-800 flex flex-col min-h-[300px]">
                <h3 className="font-bold text-slate-800 dark:text-zinc-200 text-sm flex items-center gap-2 pb-3.5 border-b border-slate-100 dark:border-zinc-850 mb-5">
                  <FileSpreadsheet className="w-4.5 h-4.5 text-indigo-650" />
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
                          <span className="font-extrabold">{item.value} phiếu</span>
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
                <h3 className="font-bold text-slate-800 dark:text-zinc-200 text-sm flex items-center gap-2 pb-3.5 border-b border-slate-100 dark:border-zinc-850 mb-5">
                  <Clock className="w-4.5 h-4.5 text-indigo-650" />
                  Nhật ký cập nhật toàn công ty
                </h3>

                {recentLogs.length > 0 ? (
                  <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                    {recentLogs.slice(0, 5).map((log: any, idx: number) => {
                      const isUp = log.valueDelta >= 0;
                      return (
                        <div key={log.id || idx} className="flex gap-3 text-xs border-b border-slate-100 dark:border-zinc-850 pb-3 last:border-0 last:pb-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                            isUp 
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30' 
                              : 'bg-rose-50 text-rose-600 dark:bg-rose-950/30'
                          }`}>
                            {isUp ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-black text-slate-800 dark:text-zinc-200 truncate">
                                {log.kpiItemName || log.kpiItem?.name || `Chỉ tiêu #${log.kpiItemId}`}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap shrink-0">
                                {new Date(log.createdAt).toLocaleDateString('vi-VN')}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                              Người cập nhật: <span className="font-bold text-slate-700 dark:text-zinc-300">{log.employeeName || `Nhân viên #${log.employeeId}`}</span>
                            </div>
                            <div className="text-[10px] text-slate-450 mt-1">
                              Giá trị: <span className="font-bold">{log.valueBefore}</span> → <span className="font-extrabold text-indigo-600">{log.valueAfter}</span>
                              {log.notes && <span className="italic text-slate-400 block mt-0.5">"{log.notes}"</span>}
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
