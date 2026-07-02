import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import {
  Target,
  Award,
  Users,
  Activity,
  Clock,
  RefreshCw,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { CustomSelect } from '../../../components/ui';
import { kpiTrackingService, kpiItemService } from '../../kpi-document';

interface ManagerDashboardProps {
  user: any;
  cycles: any[];
  currentDocs: any[];
  recentLogs: any[];
  selectedCycleId: number | '';
  setSelectedCycleId: (val: number | '') => void;
  isLoading: boolean;
  loadDashboardData: () => void;
}

// Helper to compute overall document completion rate from items
const getDocCompletion = (doc: any) => {
  if (!doc.kpiItems || doc.kpiItems.length === 0) return doc.totalProgress || 0;
  let weightedSum = 0;
  let totalWeight = 0;
  doc.kpiItems.forEach((item: any) => {
    let itemComp = 0;
    if (item.targetValue > 0) {
      const current = item.currentValue || 0;
      if (item.targetType === 'LOWER_BETTER' || item.unit === 'ms' || item.unit === 'Bug') {
        itemComp = current <= item.targetValue ? 100 : (item.targetValue / current) * 100;
      } else {
        itemComp = (current / item.targetValue) * 100;
      }
    }
    const weightVal = item.documentWeight || item.parentWeight || 0;
    weightedSum += Math.min(100, Math.max(0, itemComp)) * weightVal;
    totalWeight += weightVal;
  });
  if (totalWeight <= 0) return 0;
  return Math.round(weightedSum / totalWeight);
};

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({
  user,
  cycles,
  currentDocs,
  recentLogs,
  selectedCycleId,
  setSelectedCycleId,
  isLoading,
  loadDashboardData
}) => {
  const [selectedKpiItemId, setSelectedKpiItemId] = useState<number | string>('');
  const [selectedItemDetail, setSelectedItemDetail] = useState<any>(null);
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState<boolean>(false);

  // 1. My Department Document
  const myDeptDoc = useMemo(() => {
    if (!user?.department?.id) return null;
    return currentDocs.find(d => d.targetType === 'DEPARTMENT' && d.targetId === user.department.id);
  }, [currentDocs, user]);

  // 2. Department KPI items list mapped with calculated progress
  const deptKpiItems = useMemo(() => {
    if (!myDeptDoc || !myDeptDoc.kpiItems) return [];
    return myDeptDoc.kpiItems.map((item: any) => {
      let progress = 0;
      if (item.targetValue > 0) {
        const current = item.currentValue || 0;
        if (item.targetType === 'LOWER_BETTER' || item.unit === 'ms' || item.unit === 'Bug') {
          progress = current <= item.targetValue ? 100 : Math.round((item.targetValue / current) * 100);
        } else {
          progress = Math.round((current / item.targetValue) * 100);
        }
      }
      return {
        ...item,
        progress: Math.min(100, Math.max(0, progress))
      };
    });
  }, [myDeptDoc]);

  // Set default selected department target when KPI items change
  useEffect(() => {
    if (deptKpiItems.length > 0) {
      const exists = deptKpiItems.some((item: any) => item.id === Number(selectedKpiItemId));
      if (!exists) {
        setSelectedKpiItemId(deptKpiItems[0].id);
      }
    } else {
      setSelectedKpiItemId('');
    }
  }, [deptKpiItems, selectedKpiItemId]);

  // Fetch KPI item details when selected ID changes
  useEffect(() => {
    if (!selectedKpiItemId) {
      setSelectedItemDetail(null);
      return;
    }
    const fetchItemDetail = async () => {
      try {
        const res = await kpiItemService.getById(Number(selectedKpiItemId));
        if (res.success && res.data) {
          setSelectedItemDetail(res.data);
        }
      } catch (err) {
        console.error('Error fetching KPI item detail:', err);
      }
    };
    fetchItemDetail();
  }, [selectedKpiItemId]);

  // Fetch tracking history for the selected KPI
  useEffect(() => {
    if (!selectedKpiItemId) {
      setHistoryLogs([]);
      return;
    }
    const fetchHistory = async () => {
      setIsHistoryLoading(true);
      try {
        const res = await kpiTrackingService.getHistory(Number(selectedKpiItemId));
        if (res.success && res.data) {
          setHistoryLogs(res.data);
        }
      } catch (err) {
        console.error('Error fetching KPI history:', err);
      } finally {
        setIsHistoryLoading(false);
      }
    };
    fetchHistory();
  }, [selectedKpiItemId]);

  // Selected KPI Item fully populated with API details if loaded
  const selectedKpiItem = useMemo(() => {
    const basicItem = deptKpiItems.find((item: any) => item.id === Number(selectedKpiItemId)) || null;
    if (!basicItem) return null;
    return {
      ...basicItem,
      weight: selectedItemDetail ? (selectedItemDetail.documentWeight || selectedItemDetail.parentWeight || 0) : (basicItem.documentWeight || basicItem.parentWeight || 0),
      currentValue: selectedItemDetail ? (selectedItemDetail.currentValue ?? 0) : (basicItem.currentValue || 0),
      targetValue: selectedItemDetail ? (selectedItemDetail.targetValue ?? 0) : (basicItem.targetValue || 0),
      progress: selectedItemDetail ? (selectedItemDetail.progress ?? 0) : (basicItem.progress || 0),
      unit: selectedItemDetail ? (selectedItemDetail.unit || '') : (basicItem.unit || ''),
      targetType: selectedItemDetail ? (selectedItemDetail.targetType || 'HIGHER_BETTER') : (basicItem.targetType || 'HIGHER_BETTER'),
      children: selectedItemDetail ? (selectedItemDetail.children || []) : [],
      evaluation: selectedItemDetail ? selectedItemDetail.evaluation : null
    };
  }, [deptKpiItems, selectedKpiItemId, selectedItemDetail]);

  // Format History Logs for Line/Area Chart
  const trackingChartData = useMemo(() => {
    if (historyLogs.length === 0) {
      if (selectedKpiItem) {
        const current = selectedKpiItem.currentValue;
        return [
          { date: 'Khởi tạo', 'Tiến độ': 0, val: 0 },
          { date: 'Hiện tại', 'Tiến độ': selectedKpiItem.progress, val: current }
        ];
      }
      return [];
    }

    const sorted = [...historyLogs].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const points = [{ date: 'Khởi tạo', 'Tiến độ': 0, val: 0 }];
    
    sorted.forEach(log => {
      let progress = 0;
      if (selectedKpiItem && selectedKpiItem.targetValue > 0) {
        if (selectedKpiItem.targetType === 'LOWER_BETTER' || selectedKpiItem.unit === 'ms' || selectedKpiItem.unit === 'Bug') {
          progress = log.valueAfter <= selectedKpiItem.targetValue ? 100 : Math.round((selectedKpiItem.targetValue / log.valueAfter) * 100);
        } else {
          progress = Math.round((log.valueAfter / selectedKpiItem.targetValue) * 100);
        }
      }
      const formattedDate = new Date(log.createdAt).toLocaleDateString('vi-VN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
      points.push({
        date: formattedDate,
        'Tiến độ': Math.min(100, Math.max(0, progress)),
        val: log.valueAfter
      });
    });
    return points;
  }, [historyLogs, selectedKpiItem]);

  // 3. My Subordinates (Employee level documents under my department)
  const myStaffDocs = useMemo(() => {
    if (!myDeptDoc) {
      return currentDocs.filter(d => d.targetType === 'EMPLOYEE');
    }
    return currentDocs.filter(d => d.targetType === 'EMPLOYEE' && d.parentDocId === myDeptDoc.id);
  }, [currentDocs, myDeptDoc]);

  // Subordinate completion rates for Bar Chart
  const subordinateChartData = useMemo(() => {
    if (myStaffDocs.length === 0) {
      return [
        { name: 'Nguyễn Văn AI', 'Hoàn thành': 88 },
        { name: 'Lê Thị Sales', 'Hoàn thành': 93 },
        { name: 'Trần QA', 'Hoàn thành': 50 }
      ];
    }
    return myStaffDocs.map(doc => ({
      name: doc.targetName || doc.employeeName || 'Nhân sự',
      'Hoàn thành': getDocCompletion(doc)
    }));
  }, [myStaffDocs]);

  // Subordinate KPI Status breakdown
  const managerStatusChartData = useMemo(() => {
    const counts: Record<string, number> = { DRAFT: 0, IN_PROGRESS: 0, SELF_EVALUATED: 0, EVALUATED: 0 };
    myStaffDocs.forEach(d => {
      let statusKey = d.status;
      if (statusKey === 'MANAGER_EVALUATED') statusKey = 'EVALUATED';
      if (counts[statusKey] !== undefined) {
        counts[statusKey]++;
      } else {
        counts.IN_PROGRESS++;
      }
    });

    if (myStaffDocs.length === 0) {
      return [
        { name: 'Khởi tạo', value: 1, color: '#94a3b8' },
        { name: 'Đang thực hiện', value: 3, color: '#3b82f6' },
        { name: 'Tự đánh giá', value: 2, color: '#f59e0b' },
        { name: 'Đã đánh giá', value: 1, color: '#10b981' }
      ];
    }
    return [
      { name: 'Khởi tạo', value: counts.DRAFT || 0, color: '#94a3b8' },
      { name: 'Đang thực hiện', value: counts.IN_PROGRESS || 0, color: '#3b82f6' },
      { name: 'Tự đánh giá', value: counts.SELF_EVALUATED || 0, color: '#f59e0b' },
      { name: 'Đã đánh giá', value: counts.EVALUATED || 0, color: '#10b981' }
    ].filter(item => item.value > 0);
  }, [myStaffDocs]);

  // Summaries
  const totalMyStaff = useMemo(() => {
    const uniqueStaffIds = new Set(myStaffDocs.map(d => d.targetId));
    return uniqueStaffIds.size || 3;
  }, [myStaffDocs]);

  const teamAvgCompletion = useMemo(() => {
    if (subordinateChartData.length === 0) return 0;
    const sum = subordinateChartData.reduce((acc, curr) => acc + curr['Hoàn thành'], 0);
    return Math.round(sum / subordinateChartData.length);
  }, [subordinateChartData]);

  const deptOverallCompletion = useMemo(() => {
    if (!myDeptDoc) return 0;
    return getDocCompletion(myDeptDoc);
  }, [myDeptDoc]);

  return (
    <div className="space-y-6">
      {/* Shell Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-5 pointer-events-none transform translate-x-12">
          <Target className="w-96 h-96" />
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30 text-xs font-semibold mb-3">
              <Award className="w-3.5 h-3.5 text-indigo-300" /> Hệ thống giám sát mục tiêu & Đánh giá hiệu suất KPI
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
              Trung tâm Phân tích Quản lý
            </h1>
            <p className="mt-2 text-slate-300 text-sm leading-relaxed">
              Xin chào Trưởng phòng, <span className="font-bold text-white">{user?.fullName || 'Quản lý'}</span>. Dưới đây là thống kê tiến độ, phân bổ trạng thái và nhật ký cập nhật của đội ngũ phòng ban của bạn.
            </p>
          </div>

          <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex flex-row items-center gap-3 self-stretch md:self-auto min-w-[240px]">
            <div className="flex flex-col gap-1 flex-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Chu kỳ phân tích:</span>
              <CustomSelect
                value={selectedCycleId}
                onChange={(val: string | number | undefined) => setSelectedCycleId(val ? Number(val) : '')}
                options={cycles.map(c => ({ value: c.id, label: c.name }))}
                className="w-48 text-slate-800"
              />
            </div>
            <button
              onClick={loadDashboardData}
              className="p-2.5 bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-all flex items-center justify-center self-end"
              title="Làm mới dữ liệu"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* STATS OVERVIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 dark:bg-zinc-900 dark:border-zinc-800">
          <div className="w-12 h-12 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-400 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider block">Nhân sự trực thuộc</span>
            <h3 className="text-xl font-black text-slate-800 dark:text-zinc-100 mt-1">{totalMyStaff} thành viên</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 dark:bg-zinc-900 dark:border-zinc-800">
          <div className="w-12 h-12 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-400 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider block">Hoàn thành phòng ban</span>
            <h3 className="text-xl font-black text-slate-800 dark:text-zinc-100 mt-1">{deptOverallCompletion}%</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 dark:bg-zinc-900 dark:border-zinc-800">
          <div className="w-12 h-12 rounded-lg bg-sky-50 dark:bg-sky-950/40 flex items-center justify-center text-sky-600 dark:text-sky-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-400 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider block">Trung bình đội ngũ</span>
            <h3 className="text-xl font-black text-slate-800 dark:text-zinc-100 mt-1">{teamAvgCompletion}%</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 dark:bg-zinc-900 dark:border-zinc-800">
          <div className="w-12 h-12 rounded-lg bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-400 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider block">Mục tiêu cấp dưới</span>
            <h3 className="text-xl font-black text-slate-800 dark:text-zinc-100 mt-1">{myStaffDocs.length} mục tiêu</h3>
          </div>
        </div>
      </div>

      {/* SECTION 1: DETAILED DEPARTMENT PROGRESS ANALYSIS */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 dark:bg-zinc-900 dark:border-zinc-800">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100 dark:border-zinc-850 mb-6">
          <div>
            <h3 className="text-sm font-extrabold uppercase text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
              <Target className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
              Theo dõi & Phân tích Chi tiết Chỉ tiêu Phòng Ban
            </h3>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Chọn một chỉ tiêu cấp phòng ban để xem chi tiết phân rã và biểu đồ lịch sử thay đổi</p>
          </div>

          <div className="w-full sm:w-auto">
            <select
              value={selectedKpiItemId}
              onChange={e => setSelectedKpiItemId(e.target.value)}
              className="w-full sm:w-72 p-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-850 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-250 bg-slate-50"
            >
              {deptKpiItems.map((item: any) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.progress}%)
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedKpiItem ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: KPI Info & Progress Circle */}
            <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-zinc-950/40 rounded-xl border border-slate-150 dark:border-zinc-850/70 text-center">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="72" cy="72" r="62" strokeWidth="10" stroke="#f1f5f9" fill="transparent" className="dark:stroke-zinc-800" />
                  <circle
                    cx="72"
                    cy="72"
                    r="62"
                    strokeWidth="10"
                    stroke="#6366f1"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 62}
                    strokeDashoffset={2 * Math.PI * 62 * (1 - Math.min(100, Math.max(0, selectedKpiItem.progress)) / 100)}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-slate-800 dark:text-zinc-100">{selectedKpiItem.progress}%</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Đạt được</span>
                </div>
              </div>

              <h4 className="mt-4 text-xs font-bold text-slate-800 dark:text-zinc-200 line-clamp-2 px-2">
                {selectedKpiItem.name}
              </h4>

              <div className="w-full mt-6 grid grid-cols-2 gap-3 text-left">
                <div className="bg-white p-3 rounded-lg border border-slate-100 dark:bg-zinc-900 dark:border-zinc-800">
                  <span className="text-[9px] text-slate-400 block font-semibold uppercase">Thực tế</span>
                  <span className="text-xs font-black text-slate-700 dark:text-zinc-200">
                    {Number(selectedKpiItem.currentValue).toLocaleString()} {selectedKpiItem.unit}
                  </span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-100 dark:bg-zinc-900 dark:border-zinc-800">
                  <span className="text-[9px] text-slate-400 block font-semibold uppercase">Chỉ tiêu</span>
                  <span className="text-xs font-black text-slate-700 dark:text-zinc-200">
                    {Number(selectedKpiItem.targetValue).toLocaleString()} {selectedKpiItem.unit}
                  </span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-100 dark:bg-zinc-900 dark:border-zinc-800">
                  <span className="text-[9px] text-slate-400 block font-semibold uppercase">Trọng số</span>
                  <span className="text-xs font-black text-slate-700 dark:text-zinc-200">
                    {selectedKpiItem.weight ? (selectedKpiItem.weight <= 1 ? Math.round(selectedKpiItem.weight * 100) : selectedKpiItem.weight) : 0}%
                  </span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-100 dark:bg-zinc-900 dark:border-zinc-800">
                  <span className="text-[9px] text-slate-400 block font-semibold uppercase">Loại</span>
                  <span className="text-[9px] font-bold text-slate-700 dark:text-zinc-200 truncate block">
                    {selectedKpiItem.targetType === 'LOWER_BETTER' ? 'Càng thấp càng tốt' : selectedKpiItem.targetType === 'EXACT' ? 'Đạt chính xác' : 'Càng cao càng tốt'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: History Tracking Chart */}
            <div className="lg:col-span-8 flex flex-col justify-between">
              <div className="flex-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-4">Biểu đồ Lịch sử Thay đổi Tiến độ</span>
                <div className="h-60 w-full">
                  {isHistoryLoading ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin" />
                      <span className="text-xs text-slate-400">Đang tải lịch sử...</span>
                    </div>
                  ) : trackingChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trackingChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="managerProgressGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-zinc-800/60" />
                        <XAxis dataKey="date" tick={{ fontSize: 8, fill: '#94a3b8' }} tickLine={false} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 8, fill: '#94a3b8' }} tickLine={false} />
                        <Tooltip
                          contentStyle={{
                            fontSize: '10px',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="Tiến độ"
                          stroke="#6366f1"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#managerProgressGrad)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-50 dark:bg-zinc-950/20 border border-dashed border-slate-200 dark:border-zinc-800 rounded-lg">
                      <span className="text-xs text-slate-400 italic">Không có dữ liệu lịch sử thay đổi</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Children (Subordinate KPIs cascading from this department KPI) */}
              {selectedKpiItem.children && selectedKpiItem.children.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Phân rã chỉ tiêu xuống nhân sự cấp dưới:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-36 overflow-y-auto pr-1">
                    {selectedKpiItem.children.map((child: any) => {
                      let childProgress = 0;
                      if (child.targetValue > 0) {
                        const cur = child.currentValue || 0;
                        if (child.targetType === 'LOWER_BETTER' || child.unit === 'ms' || child.unit === 'Bug') {
                          childProgress = cur <= child.targetValue ? 100 : Math.round((child.targetValue / cur) * 100);
                        } else {
                          childProgress = Math.round((cur / child.targetValue) * 100);
                        }
                      }
                      childProgress = Math.min(100, Math.max(0, childProgress));

                      return (
                        <div key={child.id} className="p-2.5 bg-slate-50 dark:bg-zinc-950/30 rounded-lg border border-slate-150 dark:border-zinc-850 text-[10px] flex justify-between items-center">
                          <div className="min-w-0">
                            <span className="font-bold text-slate-700 dark:text-zinc-250 truncate block" title={child.name}>
                              {child.name}
                            </span>
                            <span className="text-slate-400 block font-semibold">
                              Giao cho: {child.documentTargetName || 'Nhân sự'} (Trọng số: {child.parentWeight ? (child.parentWeight <= 1 ? Math.round(child.parentWeight * 100) : child.parentWeight) : 0}%)
                            </span>
                          </div>
                          <span className="shrink-0 ml-2 font-black text-indigo-600 dark:text-indigo-400">
                            {childProgress}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <span className="text-xs text-slate-400 italic">Không tìm thấy mục tiêu cấp phòng ban nào trong chu kỳ này.</span>
          </div>
        )}
      </section>

      {/* CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Bar Chart - Team Completion Rates */}
        <section className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col dark:bg-zinc-900 dark:border-zinc-800">
          <h3 className="text-sm font-extrabold uppercase text-slate-500 dark:text-zinc-400 mb-4 flex items-center gap-1.5 border-b border-slate-100 dark:border-zinc-850 pb-3">
            <Users className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
            Tỷ lệ hoàn thành mục tiêu trung bình của nhân sự cấp dưới (%)
          </h3>
          <div className="h-72 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subordinateChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-zinc-800" />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                <Bar dataKey="Hoàn thành" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Right Column Stack: Pie Chart + Recent Activity Feed */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Pie Chart - KPI Statuses */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col dark:bg-zinc-900 dark:border-zinc-800">
            <h3 className="text-sm font-extrabold uppercase text-slate-500 dark:text-zinc-400 mb-4 flex items-center gap-1.5 border-b border-slate-100 dark:border-zinc-850 pb-3">
              <Activity className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
              Phân bổ trạng thái mục tiêu đội ngũ
            </h3>
            <div className="h-48 w-full flex flex-col justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={managerStatusChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {managerStatusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '8px' }} />
                  <Legend layout="horizontal" align="center" verticalAlign="bottom" iconSize={8} wrapperStyle={{ fontSize: '9px', color: '#64748b' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Dynamic Recent Activity Feed */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col dark:bg-zinc-900 dark:border-zinc-800 flex-1 min-h-[260px]">
            <h3 className="text-sm font-extrabold uppercase text-slate-500 dark:text-zinc-400 mb-4 flex items-center gap-1.5 border-b border-slate-100 dark:border-zinc-850 pb-3">
              <Clock className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
              Nhật ký cập nhật tiến độ phòng ban
            </h3>
            <div className="w-full flex-1 flex flex-col justify-center">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-6 gap-2">
                  <RefreshCw className="w-5 h-5 text-indigo-600 animate-spin" />
                  <span className="text-xs text-slate-400">Đang tải...</span>
                </div>
              ) : recentLogs.length > 0 ? (
                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                  {recentLogs.map((log: any) => {
                    const isUp = log.valueDelta >= 0;
                    const itemName = log.kpiItemName || log.kpiItem?.name || `Tiêu chí #${log.kpiItemId}`;
                    return (
                      <div key={log.id} className="p-3 bg-slate-50 dark:bg-zinc-950/40 border border-slate-150 dark:border-zinc-850 rounded-xl text-[10px] text-slate-550 dark:text-zinc-400 space-y-1">
                        <div className="flex justify-between items-center font-bold text-slate-700 dark:text-zinc-200">
                          <span className="truncate max-w-[120px]" title={log.reporterName || log.reporter?.fullName}>
                            {log.reporterName || log.reporter?.fullName || 'Nhân viên'}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] ${isUp ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                            {isUp ? '+' : ''}{Number(log.valueDelta).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-[9px] font-semibold text-slate-650 dark:text-zinc-350 truncate">
                          {itemName}
                        </div>
                        {log.notes && (
                          <p className="italic text-slate-400 dark:text-zinc-500 bg-white dark:bg-zinc-900/50 p-1.5 rounded border border-slate-100 dark:border-zinc-850 truncate">
                            "{log.notes}"
                          </p>
                        )}
                        <div className="text-[8px] text-slate-400 text-right font-semibold">
                          {log.createdAt ? new Date(log.createdAt).toLocaleString('vi-VN') : ''}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6">
                  <span className="block text-xs text-slate-400 italic">Chưa có cập nhật tiến độ nào.</span>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
