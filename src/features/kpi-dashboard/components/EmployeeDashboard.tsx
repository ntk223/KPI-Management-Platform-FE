import React, { useState, useEffect, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import {
  Target,
  Award,
  RefreshCw,
  Activity,
  TrendingUp,
  UserCheck,
  MessageSquare,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { CustomSelect } from '../../../components/ui';
import { kpiTrackingService, kpiItemService } from '../../kpi-document';

interface EmployeeDashboardProps {
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
  if (!doc.kpiItems || doc.kpiItems.length === 0) return 0;
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
    weightedSum += Math.min(100, Math.max(0, itemComp)) * (item.documentWeight || item.parentWeight || 0);
    totalWeight += item.documentWeight || item.parentWeight || 0;
  });
  if (totalWeight <= 0) return 0;
  return Math.round(weightedSum / totalWeight);
};

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({
  user,
  cycles,
  currentDocs,
  selectedCycleId,
  setSelectedCycleId,
  isLoading,
  loadDashboardData
}) => {
  const [selectedKpiItemId, setSelectedKpiItemId] = useState<number | string>('');
  const [selectedItemDetail, setSelectedItemDetail] = useState<any>(null);
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState<boolean>(false);

  // My employee documents in the selected cycle
  const myKpis = useMemo(() => {
    if (!user?.employeeId) return [];
    return currentDocs.filter(d => d.targetType === 'EMPLOYEE' && d.targetId === user.employeeId);
  }, [currentDocs, user]);

  // My individual KPI items list mapped with calculated progress
  const myKpiItems = useMemo(() => {
    if (myKpis.length === 0 || !myKpis[0].kpiItems) return [];
    return myKpis[0].kpiItems.map((item: any) => {
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
  }, [myKpis]);

  // Set default selected target when KPI items change
  useEffect(() => {
    if (myKpiItems.length > 0) {
      const exists = myKpiItems.some((item: any) => item.id === Number(selectedKpiItemId));
      if (!exists) {
        setSelectedKpiItemId(myKpiItems[0].id);
      }
    } else {
      setSelectedKpiItemId('');
    }
  }, [myKpiItems, selectedKpiItemId]);

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
    const basicItem = myKpiItems.find((item: any) => item.id === Number(selectedKpiItemId)) || null;
    if (!basicItem) return null;
    return {
      ...basicItem,
      weight: selectedItemDetail ? (selectedItemDetail.documentWeight || selectedItemDetail.parentWeight || 0) : (basicItem.documentWeight || basicItem.parentWeight || 0),
      currentValue: selectedItemDetail ? (selectedItemDetail.currentValue ?? 0) : (basicItem.currentValue || 0),
      targetValue: selectedItemDetail ? (selectedItemDetail.targetValue ?? 0) : (basicItem.targetValue || 0),
      progress: selectedItemDetail ? (selectedItemDetail.progress ?? 0) : (basicItem.progress || 0),
      unit: selectedItemDetail ? (selectedItemDetail.unit || '') : (basicItem.unit || ''),
      targetType: selectedItemDetail ? (selectedItemDetail.targetType || 'HIGHER_BETTER') : (basicItem.targetType || 'HIGHER_BETTER'),
      evaluation: selectedItemDetail ? selectedItemDetail.evaluation : null
    };
  }, [myKpiItems, selectedKpiItemId, selectedItemDetail]);

  // Format History Logs for Line/Area Chart
  const trackingChartData = useMemo(() => {
    if (historyLogs.length === 0) {
      if (selectedKpiItem) {
        const current = selectedKpiItem.currentValue;
        return [
          { date: 'Khởi tạo', 'Tiến độ': 0, val: 0, reporter: 'Hệ thống', notes: 'Khởi tạo chỉ tiêu' },
          { date: 'Hiện tại', 'Tiến độ': selectedKpiItem.progress, val: current, reporter: 'Hệ thống', notes: 'Tiến độ hiện tại' }
        ];
      }
      return [];
    }

    const sorted = [...historyLogs].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const points = [{ date: 'Khởi tạo', 'Tiến độ': 0, val: 0, reporter: 'Hệ thống', notes: 'Khởi tạo chỉ tiêu' }];
    
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
        val: log.valueAfter,
        reporter: log.reporterName || 'Nhân viên',
        notes: log.notes || 'Cập nhật tiến độ'
      });
    });
    return points;
  }, [historyLogs, selectedKpiItem]);

  // Overall personal completion rate
  const overallMyCompletion = useMemo(() => {
    if (myKpis.length === 0) return 0;
    return getDocCompletion(myKpis[0]);
  }, [myKpis]);

  // Highest performing target
  const highestItem = useMemo(() => {
    if (myKpiItems.length === 0) return null;
    return [...myKpiItems].sort((a, b) => b.progress - a.progress)[0];
  }, [myKpiItems]);

  // Overall performance rating label
  const overallRating = useMemo(() => {
    const p = overallMyCompletion;
    if (p >= 90) return { label: 'Xuất sắc', color: 'text-indigo-600 bg-indigo-50 border-indigo-100 dark:text-indigo-400 dark:bg-indigo-950/40 dark:border-indigo-900/50' };
    if (p >= 75) return { label: 'Khá', color: 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:text-emerald-400 dark:bg-emerald-950/40 dark:border-emerald-900/50' };
    if (p >= 50) return { label: 'Trung bình', color: 'text-amber-600 bg-amber-50 border-amber-100 dark:text-amber-400 dark:bg-amber-950/40 dark:border-amber-900/50' };
    return { label: 'Cần cải thiện', color: 'text-rose-600 bg-rose-50 border-rose-100 dark:text-rose-400 dark:bg-rose-950/40 dark:border-rose-900/50' };
  }, [overallMyCompletion]);

  return (
    <div className="space-y-6">
      {/* Shell Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 relative">
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
          <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-5 transform translate-x-12">
            <Target className="w-96 h-96" />
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30 text-xs font-semibold mb-3">
              <Award className="w-3.5 h-3.5 text-indigo-300" /> Hệ thống giám sát mục tiêu & Đánh giá hiệu suất KPI
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
              Trung tâm Phân tích Cá nhân
            </h1>
            <p className="mt-2 text-slate-300 text-sm leading-relaxed">
              Xin chào, <span className="font-bold text-white">{user?.fullName || 'Thành viên'}</span>. Dưới đây là kết quả đo lường hiệu suất và biểu đồ trực quan hóa tiến độ mục tiêu cá nhân của bạn.
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

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 dark:bg-zinc-900 dark:border-zinc-800">
          <div className="w-12 h-12 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-400 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider block">Tiến độ cá nhân</span>
            <h3 className="text-xl font-black text-slate-800 dark:text-zinc-100 mt-1">{overallMyCompletion}%</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 dark:bg-zinc-900 dark:border-zinc-800">
          <div className="w-12 h-12 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-400 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider block">Số lượng chỉ tiêu</span>
            <h3 className="text-xl font-black text-slate-800 dark:text-zinc-100 mt-1">{myKpiItems.length} mục tiêu</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 dark:bg-zinc-900 dark:border-zinc-800">
          <div className="w-12 h-12 rounded-lg bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-slate-400 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider block">Chỉ tiêu cao nhất</span>
            <h3 className="text-[11px] font-bold text-slate-800 dark:text-zinc-100 truncate mt-1" title={highestItem?.name}>
              {highestItem ? `${highestItem.name} (${highestItem.progress}%)` : 'N/A'}
            </h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 dark:bg-zinc-900 dark:border-zinc-800">
          <div className="w-12 h-12 rounded-lg bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-400 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider block">Xếp loại hiệu suất</span>
            <span className={`inline-block px-2.5 py-0.5 mt-1.5 rounded-full text-xs font-bold border ${overallRating.color}`}>
              {overallRating.label}
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 1: DETAILED PROGRESS ANALYSIS */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 dark:bg-zinc-900 dark:border-zinc-800">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100 dark:border-zinc-850 mb-6">
          <div>
            <h3 className="text-sm font-extrabold uppercase text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
              <Target className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
              Theo dõi & Phân tích Chi tiết Từng Mục Tiêu Cá Nhân
            </h3>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Chọn một mục tiêu để xem chi tiết tiến độ, biểu đồ lịch sử và nhận xét đánh giá</p>
          </div>

          <div className="w-full sm:w-72">
            <CustomSelect
              value={selectedKpiItemId}
              onChange={(val: string | number | undefined) => setSelectedKpiItemId(val ? Number(val) : '')}
              options={myKpiItems.map((item: any) => ({
                value: item.id,
                label: `${item.name} (${item.progress}%)`
              }))}
            />
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
            <div className="lg:col-span-8 flex flex-col">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-4">Biểu đồ Lịch sử Thay đổi Tiến độ</span>
              <div className="h-64 w-full flex-1">
                {isHistoryLoading ? (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                    <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin" />
                    <span className="text-xs text-slate-400">Đang tải lịch sử...</span>
                  </div>
                ) : trackingChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trackingChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="employeeProgressGrad" x1="0" y1="0" x2="0" y2="1">
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
                        fill="url(#employeeProgressGrad)"
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
          </div>
        ) : (
          <div className="text-center py-12">
            <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <span className="text-xs text-slate-400 italic">Không tìm thấy mục tiêu nào phù hợp trong chu kỳ này.</span>
          </div>
        )}
      </section>

      {/* SECTION 2: EVALUATIONS SIDE-BY-SIDE */}
      {selectedKpiItem && selectedKpiItem.evaluation ? (
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 dark:bg-zinc-900 dark:border-zinc-800">
          <h3 className="text-sm font-extrabold uppercase text-slate-500 dark:text-zinc-400 mb-4 flex items-center gap-1.5 border-b border-slate-100 dark:border-zinc-850 pb-3">
            <MessageSquare className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
            Đánh Giá Hiệu Suất Chỉ Tiêu
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Self Evaluation */}
            <div className="p-4 bg-indigo-50/40 dark:bg-indigo-950/10 rounded-xl border border-indigo-100/50 dark:border-indigo-900/30 space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-indigo-100/30 dark:border-indigo-900/20">
                <span className="text-xs font-black text-indigo-700 dark:text-indigo-300">Tự đánh giá</span>
                {selectedKpiItem.evaluation.selfScore !== null ? (
                  <span className="px-2 py-0.5 text-xs font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 rounded-full border border-indigo-200 dark:border-indigo-900">
                    Điểm tự đánh giá: {selectedKpiItem.evaluation.selfScore}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 italic">Chưa đánh giá</span>
                )}
              </div>
              <p className="text-xs text-slate-650 dark:text-zinc-350 min-h-[60px] whitespace-pre-line leading-relaxed">
                {selectedKpiItem.evaluation.selfComment || 'Chưa có nhận xét tự đánh giá.'}
              </p>
              {selectedKpiItem.evaluation.selfEvalAt && (
                <span className="block text-[9px] text-slate-400 text-right font-medium">
                  Cập nhật: {new Date(selectedKpiItem.evaluation.selfEvalAt).toLocaleString('vi-VN')}
                </span>
              )}
            </div>

            {/* Manager Evaluation */}
            <div className="p-4 bg-emerald-50/40 dark:bg-emerald-950/10 rounded-xl border border-emerald-100/50 dark:border-emerald-900/30 space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-emerald-100/30 dark:border-emerald-900/20">
                <span className="text-xs font-black text-emerald-700 dark:text-emerald-300">Quản lý đánh giá</span>
                {selectedKpiItem.evaluation.managerScore !== null ? (
                  <span className="px-2 py-0.5 text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 rounded-full border border-emerald-200 dark:border-emerald-900">
                    Điểm quản lý: {selectedKpiItem.evaluation.managerScore}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 italic">Chưa đánh giá</span>
                )}
              </div>
              <p className="text-xs text-slate-650 dark:text-zinc-350 min-h-[60px] whitespace-pre-line leading-relaxed">
                {selectedKpiItem.evaluation.managerComment || 'Quản lý chưa đưa ra nhận xét đánh giá.'}
              </p>
              {selectedKpiItem.evaluation.managerEvalAt && (
                <span className="block text-[9px] text-slate-400 text-right font-medium">
                  Đánh giá lúc: {new Date(selectedKpiItem.evaluation.managerEvalAt).toLocaleString('vi-VN')}
                </span>
              )}
            </div>
          </div>

          {selectedKpiItem.evaluation.finalScore !== null && (
            <div className="mt-4 p-4 bg-slate-50 dark:bg-zinc-950/30 rounded-xl border border-slate-250 dark:border-zinc-800 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">Kết quả đánh giá chốt cuối cùng:</span>
              <span className="px-4 py-1 text-sm font-black bg-indigo-600 text-white dark:bg-indigo-500 rounded-lg">
                {selectedKpiItem.evaluation.finalScore} / 100
              </span>
            </div>
          )}
        </section>
      ) : null}

      {/* SECTION 3: ALL MY KPI GOALS GRID */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 dark:bg-zinc-900 dark:border-zinc-800">
        <h3 className="text-sm font-extrabold uppercase text-slate-500 dark:text-zinc-400 mb-5 flex items-center gap-1.5 border-b border-slate-100 dark:border-zinc-850 pb-3">
          <CheckCircle className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
          Danh Sách Toàn Bộ Mục Tiêu Cá Nhân Trong Chu Kỳ
        </h3>

        {myKpiItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myKpiItems.map((item: any) => {
              const hasEval = item.evaluation;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedKpiItemId(item.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedKpiItemId === item.id
                      ? 'border-indigo-600 bg-indigo-50/10 shadow-sm dark:border-indigo-550 dark:bg-indigo-950/10'
                      : 'border-slate-150 bg-white hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:bg-zinc-850/60'
                  }`}
                >
                  <div className="flex justify-between items-start gap-3">
                    <span className="text-xs font-extrabold text-slate-800 dark:text-zinc-100 line-clamp-2 flex-1">
                      {item.name}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-zinc-800 dark:text-zinc-400 px-2 py-0.5 rounded-full shrink-0">
                      Trọng số: {(() => {
                        const w = item.documentWeight || item.parentWeight || 0;
                        return w <= 1 ? Math.round(w * 100) : w;
                      })()}%
                    </span>
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex justify-between text-[9px] font-bold text-slate-400 mb-1">
                        <span>Tiến độ</span>
                        <span>{item.progress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="text-[9px] text-slate-400 block font-semibold">Hiện tại / Mục tiêu</span>
                      <span className="text-xs font-extrabold text-slate-700 dark:text-zinc-200">
                        {Number(item.currentValue).toLocaleString()} / {Number(item.targetValue).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {hasEval && (
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800/80 flex justify-between items-center text-[9px] text-slate-400 font-bold">
                      <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                        <MessageSquare className="w-3 h-3" />
                        Đã có đánh giá của quản lý
                      </span>
                      {item.evaluation.finalScore !== null && (
                        <span className="text-slate-500 dark:text-zinc-300">
                          Điểm chốt: {item.evaluation.finalScore}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <span className="text-xs text-slate-400 italic">Chưa có mục tiêu cá nhân nào được giao.</span>
          </div>
        )}
      </section>
    </div>
  );
};
