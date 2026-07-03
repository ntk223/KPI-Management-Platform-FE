import React, { useState, useEffect, useMemo } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid
} from 'recharts';
import {
  Target,
  Award,
  Users,
  Layers,
  Activity,
  Clock,
  RefreshCw,
  TrendingUp
} from 'lucide-react';
import { CustomSelect } from '../../../components/ui';
import { kpiTrackingService, kpiItemService, kpiDocumentService } from '../../kpi-document';

interface DirectorDashboardProps {
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

export const DirectorDashboard: React.FC<DirectorDashboardProps> = ({
  user,
  cycles,
  departments,
  currentDocs,
  recentLogs,
  selectedCycleId,
  setSelectedCycleId,
  isLoading,
  loadDashboardData
}) => {
  const [selectedCompanyItemId, setSelectedCompanyItemId] = useState<number | string>('');
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState<boolean>(false);
  const [selectedItemDetail, setSelectedItemDetail] = useState<any>(null);
  const [deptProgressMap, setDeptProgressMap] = useState<Record<number, number>>({});

  useEffect(() => {
    if (!selectedCycleId || departments.length === 0) {
      setDeptProgressMap({});
      return;
    }

    const fetchDeptProgress = async () => {
      const activeDepts = departments.filter(d => d.id !== 1);
      const progressMap: Record<number, number> = {};

      await Promise.all(
        activeDepts.map(async (dept) => {
          try {
            const res = await kpiDocumentService.search({ cycleId: Number(selectedCycleId), targetType: 'DEPARTMENT', targetId: dept.id });
            if (res.success && res.data && res.data.length > 0) {
              console.log("res.data[0]:", res.data[0]);

              progressMap[dept.id] = Math.round(Number(res.data[0].totalProgress ?? 0));
            } else {
              progressMap[dept.id] = 0;
            }
          } catch (err) {
            console.error(`Error fetching KPI document for department ${dept.name}:`, err);
            progressMap[dept.id] = 0;
          }
        })
      );

      setDeptProgressMap(progressMap);
    };

    fetchDeptProgress();
  }, [selectedCycleId, departments, currentDocs]);

  // Fetch KPI item details when selected ID changes
  useEffect(() => {
    if (!selectedCompanyItemId) {
      setSelectedItemDetail(null);
      return;
    }
    const fetchItemDetail = async () => {
      try {
        const res = await kpiItemService.getById(Number(selectedCompanyItemId));
        if (res.success && res.data) {
          setSelectedItemDetail(res.data);
        }
      } catch (err) {
        console.error('Error fetching KPI item detail:', err);
      }
    };
    fetchItemDetail();
  }, [selectedCompanyItemId]);

  // General counts & stats
  const totalEmployees = useMemo(() => {
    const empDocs = currentDocs.filter(doc => doc.targetType === 'EMPLOYEE');
    const uniqueIds = new Set(empDocs.map(d => d.targetId));
    return uniqueIds.size || 3;
  }, [currentDocs]);

  // Overall Company Progress
  const companyOverallProgress = useMemo(() => {
    const compDocs = currentDocs.filter(d => d.targetType === 'COMPANY');
    if (compDocs.length === 0) return 72; // default mock
    let sum = 0;
    compDocs.forEach(d => {
      sum += d.totalProgress ?? 0;
    });
    return Math.round(sum / compDocs.length);
  }, [currentDocs]);

  // Company KPI options
  const companyKpiOptions = useMemo(() => {
    const compDocs = currentDocs.filter(d => d.targetType === 'COMPANY');
    const items: any[] = [];
    compDocs.forEach(doc => {
      if (doc.kpiItems) {
        doc.kpiItems.forEach((item: any) => {
          items.push({
            id: item.id,
            name: item.name,
            weight: item.documentWeight || 0,
            currentValue: item.currentValue || 0,
            targetValue: item.targetValue || 0,
            unit: item.unit || '',
            targetType: item.targetType || 'HIGHER_BETTER',
            progress: Math.round(item.progress || 0),
            docId: doc.id
          });
        });
      }
    });
    return items;
  }, [currentDocs]);

  // Set default company KPI item when options change
  useEffect(() => {
    if (companyKpiOptions.length > 0 && !selectedCompanyItemId) {
      setSelectedCompanyItemId(companyKpiOptions[0].id);
    }
  }, [companyKpiOptions, selectedCompanyItemId]);

  // Selected Company KPI Item details (merged with latest API details if available)
  const selectedCompanyItem = useMemo(() => {
    const basicItem = companyKpiOptions.find(item => item.id === Number(selectedCompanyItemId)) || null;
    if (!basicItem) return null;
    return {
      ...basicItem,
      weight: selectedItemDetail ? (selectedItemDetail.documentWeight || selectedItemDetail.parentWeight || 0) : (basicItem.weight || 0),
      currentValue: selectedItemDetail ? (selectedItemDetail.currentValue ?? 0) : (basicItem.currentValue || 0),
      targetValue: selectedItemDetail ? (selectedItemDetail.targetValue ?? 0) : (basicItem.targetValue || 0),
      progress: selectedItemDetail ? (selectedItemDetail.progress ?? 0) : (basicItem.progress || 0),
      unit: selectedItemDetail ? (selectedItemDetail.unit || '') : (basicItem.unit || ''),
      targetType: selectedItemDetail ? (selectedItemDetail.targetType || 'HIGHER_BETTER') : (basicItem.targetType || 'HIGHER_BETTER')
    };
  }, [companyKpiOptions, selectedCompanyItemId, selectedItemDetail]);

  // Fetch tracking history when selected KPI changes
  useEffect(() => {
    if (!selectedCompanyItemId) {
      setHistoryLogs([]);
      return;
    }
    const fetchHistory = async () => {
      setIsHistoryLoading(true);
      try {
        const res = await kpiTrackingService.getHistory(Number(selectedCompanyItemId));
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
  }, [selectedCompanyItemId]);

  // Format History Logs for Line/Area Chart
  const trackingChartData = useMemo(() => {
    if (historyLogs.length === 0) {
      // Mock tracking points to display a nice chart when there are no logs yet
      if (selectedCompanyItem) {
        const current = selectedCompanyItem.currentValue;
        return [
          { date: 'Bắt đầu', 'Tiến độ': 0, val: 0 },
          { date: 'Tuần 1', 'Tiến độ': Math.round(current * 0.3), val: Math.round(current * 0.3) },
          { date: 'Tuần 2', 'Tiến độ': Math.round(current * 0.6), val: Math.round(current * 0.6) },
          { date: 'Hiện tại', 'Tiến độ': selectedCompanyItem.progress, val: current }
        ];
      }
      return [
        { date: '01/06', 'Tiến độ': 15, val: 15 },
        { date: '08/06', 'Tiến độ': 32, val: 32 },
        { date: '15/06', 'Tiến độ': 48, val: 48 },
        { date: '22/06', 'Tiến độ': 72, val: 72 },
        { date: '29/06', 'Tiến độ': companyOverallProgress, val: companyOverallProgress }
      ];
    }

    // Map real logs (sort chronological)
    const sorted = [...historyLogs].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    // Build incremental timeline starting from 0
    const points = [{ date: 'K.Tạo', 'Tiến độ': 0, val: 0, reporter: 'Hệ thống', notes: 'Khởi tạo chỉ tiêu' }];
    
    sorted.forEach((log) => {
      // Calculate progress percentage at this point
      let progress = 0;
      const target = selectedCompanyItem?.targetValue || 100;
      const val = log.valueAfter || 0;
      if (target > 0) {
        if (selectedCompanyItem?.targetType === 'LOWER_BETTER' || selectedCompanyItem?.unit === 'ms' || selectedCompanyItem?.unit === 'Bug') {
          progress = val <= target ? 100 : Math.round((target / val) * 100);
        } else {
          progress = Math.round((val / target) * 100);
        }
      }
      points.push({
        date: new Date(log.createdAt).toLocaleDateString('vi-VN', { month: 'numeric', day: 'numeric' }),
        'Tiến độ': Math.min(100, Math.max(0, progress)),
        val: val,
        reporter: log.reporterName || 'Nhân sự',
        notes: log.notes || 'Cập nhật tiến độ'
      });
    });

    return points;
  }, [historyLogs, selectedCompanyItem, companyOverallProgress]);

  // Cascade Contribution (Children items of selected company KPI)
  const childItemsForSelected = useMemo(() => {
    if (!selectedCompanyItemId || currentDocs.length === 0) return [];
    const children: any[] = [];
    currentDocs.forEach(doc => {
      if (doc.targetType === 'DEPARTMENT' && doc.kpiItems) {
        doc.kpiItems.forEach((item: any) => {
          if (item.parentId === Number(selectedCompanyItemId)) {
            children.push({
              id: item.id,
              name: item.name,
              docName: doc.targetName || doc.documentCode || 'Phòng ban',
              currentValue: item.currentValue || 0,
              targetValue: item.targetValue || 0,
              unit: item.unit || '',
              progress: Math.round(item.progress || 0),
              docTotalProgress: doc.totalProgress || 0
            });
          }
        });
      }
    });
    return children;
  }, [selectedCompanyItemId, currentDocs]);

  // Chart Data: Avg KPI Completion % per Department
  const deptChartData = useMemo(() => {
    return departments
      .filter(d => d.id !== 1) // exclude BGĐ
      .map(dept => {
        return { name: dept.name, 'Hoàn thành': deptProgressMap[dept.id] ?? 0 };
      });
  }, [departments, deptProgressMap]);

  // Overall KPI status breakdown
  const docStatusStats = useMemo(() => {
    const counts: Record<string, number> = { DRAFT: 0, PENDING_APPROVAL: 0, APPROVED: 0, IN_PROGRESS: 0, CLOSED: 0 };
    currentDocs.forEach(doc => {
      if (counts[doc.status] !== undefined) {
        counts[doc.status]++;
      }
    });
    return [
      { name: 'Nháp', value: counts.DRAFT || 0, color: '#94a3b8' },
      { name: 'Chờ duyệt', value: counts.PENDING_APPROVAL || 0, color: '#f59e0b' },
      { name: 'Đang thực hiện', value: counts.IN_PROGRESS || 0, color: '#3b82f6' },
      { name: 'Đã duyệt', value: counts.APPROVED || 0, color: '#10b981' },
      { name: 'Đã đóng', value: counts.CLOSED || 0, color: '#6366f1' }
    ].filter(item => item.value > 0);
  }, [currentDocs]);

  // Leaderboard data
  const sortedDepartments = useMemo(() => {
    return [...deptChartData].sort((a, b) => b['Hoàn thành'] - a['Hoàn thành']);
  }, [deptChartData]);

  const topDepartments = useMemo(() => sortedDepartments.slice(0, 3), [sortedDepartments]);
  const lowestDepartments = useMemo(() => sortedDepartments.filter(d => d['Hoàn thành'] < 80), [sortedDepartments]);

  return (
    <div className="space-y-6">
      {/* Dynamic Shell Header Banner */}
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
              Trung tâm Phân tích Ban Giám Đốc
            </h1>
            <p className="mt-2 text-slate-300 text-sm leading-relaxed">
              Xin chào, Ban Giám Đốc <span className="font-bold text-white">{user?.fullName || ''}</span>. Dưới đây là tổng hợp số liệu đo lường hiệu suất và các biểu đồ trực quan hóa tiến độ toàn công ty.
            </p>
          </div>

          <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex flex-row items-center gap-3 self-stretch md:self-auto min-w-[240px]">
            <div className="flex flex-col gap-1 flex-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Chu kỳ phân tích:</span>
              <CustomSelect
                value={selectedCycleId}
                onChange={val => setSelectedCycleId(val ? Number(val) : '')}
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
            <span className="text-slate-400 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider">Tiến độ Tổng quan</span>
            <h3 className="text-xl font-black text-slate-800 dark:text-zinc-100 mt-1">{companyOverallProgress}%</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 dark:bg-zinc-900 dark:border-zinc-800">
          <div className="w-12 h-12 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-400 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider">Số lượng nhân sự</span>
            <h3 className="text-xl font-black text-slate-800 dark:text-zinc-100 mt-1">{totalEmployees} nhân sự</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 dark:bg-zinc-900 dark:border-zinc-800">
          <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-400 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider">Số lượng phòng ban</span>
            <h3 className="text-xl font-black text-slate-800 dark:text-zinc-100 mt-1">{departments.filter(d => d.id !== 1).length} phòng ban</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 dark:bg-zinc-900 dark:border-zinc-800">
          <div className="w-12 h-12 rounded-lg bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-400 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider">Tổng số phiếu KPI</span>
            <h3 className="text-xl font-black text-slate-800 dark:text-zinc-100 mt-1">{currentDocs.length}</h3>
          </div>
        </div>
      </div>

      {/* SECTION 1: CASCADING CORE KPI & HISTORY CHART */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 dark:bg-zinc-900 dark:border-zinc-800">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100 dark:border-zinc-850 mb-6">
          <div>
            <h3 className="text-sm font-extrabold uppercase text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
              <Target className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
              Theo dõi Tiến độ Mục tiêu Trọng điểm của Công ty
            </h3>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Chọn một mục tiêu cấp công ty để xem phân rã và lịch sử cập nhật chi tiết</p>
          </div>

          <div className="w-full sm:w-72">
            <CustomSelect
              value={selectedCompanyItemId}
              onChange={val => setSelectedCompanyItemId(val ? Number(val) : '')}
              options={companyKpiOptions.map(item => ({
                value: item.id,
                label: `${item.name} (${item.progress}%)`
              }))}
            />
          </div>
        </div>

        {/* Company KPI Detail Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: KPI Card Details & Gauge */}
          <div className="lg:col-span-3 bg-slate-50/50 dark:bg-zinc-950/20 border border-slate-150 dark:border-zinc-850 p-5 rounded-2xl flex flex-col justify-between">
            {selectedCompanyItem ? (
              <div className="space-y-5">
                <div>
                  <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-full text-[9px] font-extrabold uppercase border border-indigo-100 dark:border-indigo-900/40">
                    Trọng số: {Math.round(selectedCompanyItem.weight * 100)}%
                  </span>
                  <h4 className="text-sm font-black text-slate-800 dark:text-zinc-100 mt-2 leading-relaxed">
                    {selectedCompanyItem.name}
                  </h4>
                </div>

                {/* Progress Circle Visual */}
                <div className="flex flex-col items-center py-2">
                  <div className="relative w-32 h-32 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="52"
                        className="stroke-slate-200 dark:stroke-zinc-800"
                        strokeWidth="8"
                        fill="transparent"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="52"
                        className="stroke-indigo-600 dark:stroke-indigo-400 transition-all duration-500"
                        strokeWidth="10"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 52}
                        strokeDashoffset={2 * Math.PI * 52 * (1 - Math.min(100, selectedCompanyItem.progress) / 100)}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-2xl font-black text-slate-800 dark:text-zinc-100">
                        {selectedCompanyItem.progress}%
                      </span>
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                        Tiến độ
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-white dark:bg-zinc-900 p-2 rounded-xl border border-slate-150 dark:border-zinc-850">
                    <span className="text-[8px] text-slate-400 font-bold block uppercase">Thực tế</span>
                    <span className="text-xs font-black text-indigo-650 dark:text-indigo-400">
                      {selectedCompanyItem.currentValue.toLocaleString()}
                    </span>
                    <span className="text-[8px] text-slate-400 font-semibold block mt-0.5">
                      {selectedCompanyItem.unit}
                    </span>
                  </div>
                  <div className="bg-white dark:bg-zinc-900 p-2 rounded-xl border border-slate-150 dark:border-zinc-850">
                    <span className="text-[8px] text-slate-400 font-bold block uppercase">Chỉ tiêu</span>
                    <span className="text-xs font-black text-slate-700 dark:text-zinc-200">
                      {selectedCompanyItem.targetValue.toLocaleString()}
                    </span>
                    <span className="text-[8px] text-slate-400 font-semibold block mt-0.5">
                      {selectedCompanyItem.unit}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-xs text-slate-400 italic py-12">
                Vui lòng chọn mục tiêu công ty để xem chi tiết
              </div>
            )}
          </div>

          {/* Center: Progress Updates Tracking Chart (Biểu đồ tracking) */}
          <div className="lg:col-span-5 bg-slate-50/50 dark:bg-zinc-950/20 border border-slate-150 dark:border-zinc-850 p-5 rounded-2xl flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-extrabold uppercase text-slate-500 dark:text-zinc-400 mb-4 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                Biểu đồ Lịch sử Cập nhật Tiến độ (Tracking Chart)
              </h4>

              <div className="h-56 w-full relative">
                {isHistoryLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-zinc-900/50 rounded-xl">
                    <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin" />
                  </div>
                ) : null}

                {trackingChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trackingChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-zinc-800" />
                      <XAxis dataKey="date" tick={{ fontSize: 8, fill: '#64748b' }} tickLine={false} />
                      <YAxis domain={[0, 'auto']} tick={{ fontSize: 8, fill: '#64748b' }} tickLine={false} />
                      <Tooltip
                        contentStyle={{ fontSize: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#fff' }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="p-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-850 rounded-lg shadow-md space-y-1 text-[10px]">
                                <p className="font-extrabold text-slate-800 dark:text-zinc-100">{data.date}</p>
                                <p className="text-indigo-600 dark:text-indigo-400 font-bold">
                                  Tiến độ: {data['Tiến độ']}% ({Number(data.val).toLocaleString()} {selectedCompanyItem?.unit})
                                </p>
                                {data.reporter && (
                                  <p className="text-slate-500 font-semibold">Người cập nhật: {data.reporter}</p>
                                )}
                                {data.notes && (
                                  <p className="italic text-slate-400 border-t border-slate-100 dark:border-zinc-850 pt-1 mt-1">"{data.notes}"</p>
                                )}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area type="monotone" dataKey="Tiến độ" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorProgress)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <Activity className="w-8 h-8 text-slate-300 dark:text-zinc-700 animate-pulse mb-2" />
                    <p className="text-xs text-slate-400 italic">Không có dữ liệu lịch sử cập nhật cho chỉ tiêu này</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Cascade Contribution Chart */}
          <div className="lg:col-span-4 bg-slate-50/50 dark:bg-zinc-950/20 border border-slate-150 dark:border-zinc-850 p-5 rounded-2xl flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-extrabold uppercase text-slate-500 dark:text-zinc-400 mb-4 flex items-center gap-1">
                <Layers className="w-4 h-4 text-indigo-650" />
                Phân rã mục tiêu (Cascading) & Tỷ lệ đóng góp
              </h4>

              {childItemsForSelected.length > 0 ? (
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={childItemsForSelected} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-zinc-800" />
                      <XAxis dataKey="docName" tick={{ fontSize: 8, fill: '#64748b' }} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 8, fill: '#64748b' }} tickLine={false} />
                      <Tooltip
                        contentStyle={{ fontSize: '9px', borderRadius: '8px' }}
                        formatter={(value, _name, props: any) => [
                          `${value}% (Thực tế: ${props.payload.currentValue.toLocaleString()} / Chỉ tiêu: ${props.payload.targetValue.toLocaleString()} ${props.payload.unit}) | Tổng tiến độ phòng: ${props.payload.docTotalProgress}%`,
                          'Tiến độ tiêu chí'
                        ]}
                      />
                      <Bar dataKey="progress" fill="#818cf8" radius={[4, 4, 0, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-56 border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900/50">
                  <Activity className="w-8 h-8 text-slate-350 dark:text-zinc-650 mb-2 animate-pulse" />
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold italic text-center px-4">
                    Chưa ghi nhận mục tiêu con cấp phòng ban liên kết trực tiếp với mục tiêu này.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: DEPARTMENT PERFORMANCE COMPARISON & PIE CHART */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col dark:bg-zinc-900 dark:border-zinc-800">
          <h3 className="text-sm font-extrabold uppercase text-slate-500 dark:text-zinc-400 mb-4 flex items-center gap-1.5 border-b border-slate-100 dark:border-zinc-850 pb-3">
            <Layers className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
            Hiệu suất hoàn thành mục tiêu trung bình theo phòng ban (%)
          </h3>
          <div className="h-72 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-zinc-800" />
                <XAxis dataKey="name" tick={{ fontSize: 8, fill: '#64748b' }} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 8, fill: '#64748b' }} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                <Bar dataKey="Hoàn thành" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Right Column Stack: Pie Chart */}
        <section className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col dark:bg-zinc-900 dark:border-zinc-800">
          <h3 className="text-sm font-extrabold uppercase text-slate-500 dark:text-zinc-400 mb-4 flex items-center gap-1.5 border-b border-slate-100 dark:border-zinc-850 pb-3">
            <Activity className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
            Trạng thái xử lý phiếu KPI toàn hệ thống
          </h3>
          <div className="h-64 w-full flex flex-col justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={docStatusStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {docStatusStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                <Legend layout="horizontal" align="center" verticalAlign="bottom" iconSize={8} wrapperStyle={{ fontSize: '10px', color: '#64748b' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* SECTION 3: SYSTEM LEADERBOARD & RECENT FEED */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col dark:bg-zinc-900 dark:border-zinc-800">
          <h3 className="text-sm font-extrabold uppercase text-slate-500 dark:text-zinc-400 mb-4 flex items-center gap-1.5 border-b border-slate-100 dark:border-zinc-850 pb-3">
            <Award className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
            Bảng xếp hạng hiệu suất phòng ban
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Top 3 đơn vị dẫn đầu tiến độ
              </h4>
              <div className="space-y-2">
                {topDepartments.map((dept, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-zinc-950/30 border border-slate-150 dark:border-zinc-850 rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-450 text-[11px] font-black flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-700 dark:text-zinc-200">
                        {dept.name}
                      </span>
                    </div>
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                      {dept['Hoàn thành']}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Đơn vị cần cải thiện (Tiến độ &lt; 80%)
              </h4>
              <div className="space-y-2">
                {lowestDepartments.length > 0 ? (
                  lowestDepartments.map((dept, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-zinc-950/30 border border-slate-150 dark:border-zinc-850 rounded-xl">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-450 text-[11px] font-black flex items-center justify-center">
                          !
                        </span>
                        <span className="text-xs font-bold text-slate-700 dark:text-zinc-200">
                          {dept.name}
                        </span>
                      </div>
                      <span className="text-xs font-black text-amber-600 dark:text-amber-400">
                        {dept['Hoàn thành']}%
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-slate-400 dark:text-zinc-555 border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl italic">
                    Tuyệt vời! Tất cả các đơn vị đều đạt tiến độ &gt;= 80%.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Recent Updates activity feed */}
        <section className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col dark:bg-zinc-900 dark:border-zinc-800 min-h-[280px]">
          <h3 className="text-sm font-extrabold uppercase text-slate-500 dark:text-zinc-400 mb-4 flex items-center gap-1.5 border-b border-slate-100 dark:border-zinc-850 pb-3">
            <Clock className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
            Nhật ký cập nhật tiến độ
          </h3>
          <div className="w-full flex-1 flex flex-col justify-center">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin" />
                <span className="text-xs text-slate-400">Đang tải nhật ký...</span>
              </div>
            ) : recentLogs.length > 0 ? (
              <div className="space-y-3 max-h-[240px] overflow-y-auto pr-1">
                {recentLogs.map((log: any) => {
                  const isUp = log.valueDelta >= 0;
                  const itemName = log.kpiItemName || log.kpiItem?.name || `Tiêu chí #${log.kpiItemId}`;
                  return (
                    <div key={log.id} className="p-3 bg-slate-50 dark:bg-zinc-950/40 border border-slate-150 dark:border-zinc-850 rounded-xl text-[10px] text-slate-550 dark:text-zinc-400 space-y-1">
                      <div className="flex justify-between items-center font-bold text-slate-700 dark:text-zinc-200">
                        <span className="truncate max-w-[140px]" title={log.reporterName || log.reporter?.fullName}>
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
                        {new Date(log.createdAt).toLocaleString('vi-VN')}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <span className="block text-xs text-slate-400 italic">Chưa có cập nhật tiến độ nào trong chu kỳ này.</span>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
