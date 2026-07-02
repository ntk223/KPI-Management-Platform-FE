import React, { useMemo } from 'react';
import {
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
  Activity,
  Clock,
  RefreshCw
} from 'lucide-react';
import { CustomSelect } from '../../../components/ui';

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
    weightedSum += Math.min(100, Math.max(0, itemComp)) * (item.weight || 0);
    totalWeight += item.weight || 0;
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

  // Subordinate completion rates
  const subordinateChartData = useMemo(() => {
    const subDocs = currentDocs.filter(d => d.targetType === 'EMPLOYEE');
    if (subDocs.length === 0) {
      return [
        { name: 'Nguyễn Văn AI', 'Hoàn thành': 88 },
        { name: 'Lê Thị Sales', 'Hoàn thành': 93 },
        { name: 'Trần QA', 'Hoàn thành': 50 }
      ];
    }
    return subDocs.map(doc => {
      return {
        name: doc.targetName || 'Nhân sự',
        'Hoàn thành': getDocCompletion(doc)
      };
    });
  }, [currentDocs]);

  // Subordinate KPI Status breakdown
  const managerStatusChartData = useMemo(() => {
    const subDocs = currentDocs.filter(d => d.targetType === 'EMPLOYEE');
    const counts: Record<string, number> = { DRAFT: 0, IN_PROGRESS: 0, SELF_EVALUATED: 0, EVALUATED: 0 };
    subDocs.forEach(d => {
      let statusKey = d.status;
      if (statusKey === 'MANAGER_EVALUATED') statusKey = 'EVALUATED';
      if (counts[statusKey] !== undefined) {
        counts[statusKey]++;
      } else {
        counts.IN_PROGRESS++;
      }
    });

    if (subDocs.length === 0) {
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
  }, [currentDocs]);

  // Summaries
  const totalMyStaff = useMemo(() => {
    const subDocs = currentDocs.filter(d => d.targetType === 'EMPLOYEE');
    const uniqueStaffIds = new Set(subDocs.map(d => d.targetId));
    return uniqueStaffIds.size || 3;
  }, [currentDocs]);

  const teamAvgCompletion = useMemo(() => {
    if (subordinateChartData.length === 0) return 0;
    const sum = subordinateChartData.reduce((acc, curr) => acc + curr['Hoàn thành'], 0);
    return Math.round(sum / subordinateChartData.length);
  }, [subordinateChartData]);

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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 dark:bg-zinc-900 dark:border-zinc-800">
          <div className="w-12 h-12 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-400 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider">Tổng số nhân sự quản lý</span>
            <h3 className="text-xl font-black text-slate-800 dark:text-zinc-100 mt-1">{totalMyStaff} thành viên</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 dark:bg-zinc-900 dark:border-zinc-800">
          <div className="w-12 h-12 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-400 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider">Tiến độ Trung bình Đội ngũ</span>
            <h3 className="text-xl font-black text-slate-800 dark:text-zinc-100 mt-1">{teamAvgCompletion}%</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 dark:bg-zinc-900 dark:border-zinc-800">
          <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-400 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider">Tổng số mục tiêu KPI</span>
            <h3 className="text-xl font-black text-slate-800 dark:text-zinc-100 mt-1">{currentDocs.filter(d => d.targetType === 'EMPLOYEE').length} mục tiêu</h3>
          </div>
        </div>
      </div>

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
              Nhật ký cập nhật tiến độ
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
                          {new Date(log.createdAt).toLocaleString('vi-VN')}
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
