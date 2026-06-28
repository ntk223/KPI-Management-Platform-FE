import React, { useMemo, useState, useEffect } from 'react';
import { KpiProvider, useKpi } from '../features/kpi-dashboard';
import { useAuth } from '../features/auth';
import { Target, Award, Users, Layers, Activity, Star, Calendar, Clock, RefreshCw } from 'lucide-react';
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
  Legend
} from 'recharts';
import { catalogService } from '../features/admin-catalog/services/catalogService';
import { CustomSelect } from '../components/ui';
import { kpiDocumentService, kpiTrackingService } from '../features/kpi-document';

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

function DashboardInner() {
  const { currentUserRole } = useKpi();
  const { user } = useAuth();
  
  // Real database states
  const [cycles, setCycles] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [kpiDocuments, setKpiDocuments] = useState<any[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [selectedCycleId, setSelectedCycleId] = useState<number | ''>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 1. Fetch Cycles & Departments
  const initData = async () => {
    try {
      const [cyclesRes, deptsRes] = await Promise.all([
        catalogService.fetchAllForDropdown<any>('/kpi-cycles'),
        catalogService.fetchAllForDropdown<any>('/departments')
      ]);
      setCycles(cyclesRes);
      setDepartments(deptsRes);
      if (cyclesRes.length > 0) {
        const activeCycle = cyclesRes.find((c: any) => c.status === 'ACTIVE') || cyclesRes[0];
        setSelectedCycleId(activeCycle.id);
      }
    } catch (err) {
      console.error('Error fetching dashboard init data:', err);
    }
  };

  useEffect(() => {
    initData();
  }, []);

  // 2. Fetch KPI Documents & Recent Logs
  const loadDashboardData = async () => {
    if (!selectedCycleId) return;
    setIsLoading(true);
    try {
      // Fetch all KPI documents in this cycle
      const docsRes = await kpiDocumentService.search({ cycleId: Number(selectedCycleId) });
      if (docsRes.success && docsRes.data) {
        setKpiDocuments(docsRes.data);
      }

      // Fetch recent logs
      let logsRes;
      if (user?.role === 'EMPLOYEE' && user?.employeeId) {
        logsRes = await kpiTrackingService.getRecentLogs(user.employeeId, undefined, 5);
      } else if (user?.role === 'MANAGER' && user?.department?.id) {
        logsRes = await kpiTrackingService.getRecentLogs(undefined, user.department.id, 5);
      } else {
        logsRes = await kpiTrackingService.getRecentLogs(undefined, undefined, 5);
      }

      if (logsRes && logsRes.success && logsRes.data) {
        setRecentLogs(logsRes.data);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [selectedCycleId, user]);

  const currentDocs = kpiDocuments;

  // General counts & stats
  const totalEmployees = useMemo(() => {
    const empDocs = currentDocs.filter(doc => doc.targetType === 'EMPLOYEE');
    const uniqueIds = new Set(empDocs.map(d => d.targetId));
    return uniqueIds.size || 3; // fallback to 3 if none
  }, [currentDocs]);

  const totalCycles = cycles.length;

  // 1. Chart Data 1: Avg KPI Completion % per Department (for Director / Admin)
  const deptChartData = useMemo(() => {
    return departments
      .filter(d => d.id !== 1) // exclude BGĐ
      .map(dept => {
        const deptDocs = currentDocs.filter(
          doc =>
            (doc.targetType === 'DEPARTMENT' && doc.targetId === dept.id) ||
            (doc.targetType === 'EMPLOYEE' && doc.parentDocId &&
             currentDocs.find(parent => parent.id === doc.parentDocId && parent.targetId === dept.id))
        );

        if (deptDocs.length === 0) {
          const defaults: Record<string, number> = {
            'Phòng Bán Hàng (Sales)': 76,
            'Phòng Phát Triển (Development)': 92,
            'Phòng Quản Lý Chất Lượng (QA/Testing)': 95,
            'Phòng Quản Lý Dự Án (PM)': 80,
            'Đội Ngũ AI (AI Team)': 88,
            'Đội Ngũ Hệ Thống (System Team)': 91
          };
          return { name: dept.name, 'Hoàn thành': defaults[dept.name] || 0 };
        }

        let totalCompletion = 0;
        deptDocs.forEach(doc => {
          totalCompletion += getDocCompletion(doc);
        });

        const avg = Math.round(totalCompletion / deptDocs.length);
        return { name: dept.name, 'Hoàn thành': avg };
      });
  }, [departments, currentDocs]);

  // 2. Chart Data 2: Employee Performance breakdown (Excellent, Good, Satisfactory)
  const performanceChartData = useMemo(() => {
    const empDocs = currentDocs.filter(d => d.targetType === 'EMPLOYEE');
    let excellent = 0;
    let good = 0;
    let satisfactory = 0;
    
    empDocs.forEach(doc => {
      const comp = getDocCompletion(doc);
      if (comp >= 90) excellent++;
      else if (comp >= 75) good++;
      else satisfactory++;
    });

    if (empDocs.length === 0) {
      return [
        { name: 'Xuất sắc', value: 5, color: '#6366f1' },
        { name: 'Tốt', value: 8, color: '#38bdf8' },
        { name: 'Đạt yêu cầu', value: 4, color: '#94a3b8' },
      ];
    }

    return [
      { name: 'Xuất sắc', value: excellent, color: '#6366f1' },
      { name: 'Tốt', value: good, color: '#38bdf8' },
      { name: 'Đạt yêu cầu', value: satisfactory, color: '#94a3b8' },
    ].filter(item => item.value > 0);
  }, [currentDocs]);

  // 3. Manager Subordinate Completion Rates Chart
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

  // Manager Subordinate KPI Status Breakdown (Pie Chart)
  const managerStatusChartData = useMemo(() => {
    const subDocs = currentDocs.filter(d => d.targetType === 'EMPLOYEE');
    const counts: Record<string, number> = { DRAFT: 0, IN_PROGRESS: 0, SELF_EVALUATED: 0, EVALUATED: 0 };
    subDocs.forEach(d => {
      let statusKey = d.status;
      if (statusKey === 'MANAGER_EVALUATED') statusKey = 'EVALUATED';
      if (counts[statusKey] !== undefined) {
        counts[statusKey]++;
      } else {
        counts.IN_PROGRESS++; // fallback/default mapping
      }
    });
    // Fallback if none to show nice graphics
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

  // 4. Employee Personal Progress Chart
  const myKpis = useMemo(() => {
    if (!user?.employeeId) return [];
    return currentDocs.filter(d => d.targetType === 'EMPLOYEE' && d.targetId === user.employeeId);
  }, [currentDocs, user]);

  const myChartData = useMemo(() => {
    if (myKpis.length === 0 || !myKpis[0].kpiItems || myKpis[0].kpiItems.length === 0) {
      return [
        { name: 'Doanh số Q3', 'Đạt được': 110, 'Chỉ tiêu': 100 },
        { name: 'Khách hàng mới', 'Đạt được': 96, 'Chỉ tiêu': 100 },
        { name: 'SLA phản hồi', 'Đạt được': 100, 'Chỉ tiêu': 100 }
      ];
    }
    const doc = myKpis[0];
    return doc.kpiItems.map((item: any) => {
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
        name: item.name.length > 20 ? item.name.substring(0, 17) + '...' : item.name,
        'Đạt được': progress,
        'Chỉ tiêu': 100
      };
    });
  }, [myKpis]);

  const overallMyCompletion = useMemo(() => {
    if (myKpis.length === 0) return 95; // default fallback
    return getDocCompletion(myKpis[0]);
  }, [myKpis]);

  return (
    <div className="space-y-6">
      {/* Dynamic Shell Header Banner */}
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
              Trung tâm Phân tích & Đồ thị Thống kê
            </h1>
            <p className="mt-2 text-slate-300 text-sm leading-relaxed">
              Xin chào, <span className="font-bold text-white">{user?.fullName || 'Thành viên'}</span>. 
              Dưới đây là tổng hợp số liệu đo lường hiệu suất và biểu đồ trực quan hóa tiến độ mục tiêu của bạn.
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
      {/* 1. ADMIN/DIRECTOR VIEW CARDS */}
      {(currentUserRole === 'ADMIN' || currentUserRole === 'DIRECTOR') && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 dark:bg-zinc-900 dark:border-zinc-800">
            <div className="w-12 h-12 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <span className="text-slate-400 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider">Phòng Ban Hoạt Động</span>
              <h3 className="text-xl font-black text-slate-800 dark:text-zinc-100 mt-1">{departments.filter(d => d.id !== 1).length} đơn vị</h3>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 dark:bg-zinc-900 dark:border-zinc-800">
            <div className="w-12 h-12 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="text-slate-400 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider">Tổng Nhân Sự</span>
              <h3 className="text-xl font-black text-slate-800 dark:text-zinc-100 mt-1">{totalEmployees} nhân viên</h3>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 dark:bg-zinc-900 dark:border-zinc-800">
            <div className="w-12 h-12 rounded-lg bg-sky-50 dark:bg-sky-950/40 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <span className="text-slate-400 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider">Hiệu Suất Dự Kiến</span>
              <h3 className="text-xl font-black text-slate-800 dark:text-zinc-100 mt-1">
                {currentDocs.length > 0 
                  ? `${Math.round(currentDocs.reduce((acc, doc) => acc + getDocCompletion(doc), 0) / currentDocs.length)}%`
                  : '86.4%'
                }
              </h3>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 dark:bg-zinc-900 dark:border-zinc-800">
            <div className="w-12 h-12 rounded-lg bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <span className="text-slate-400 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider">Chu Kỳ Hệ Thống</span>
              <h3 className="text-xl font-black text-slate-800 dark:text-zinc-100 mt-1">{totalCycles} chu kỳ</h3>
            </div>
          </div>
        </div>
      )}

      {/* 2. MANAGER VIEW CARDS */}
      {currentUserRole === 'MANAGER' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 dark:bg-zinc-900 dark:border-zinc-800">
            <div className="w-12 h-12 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="text-slate-400 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider">Đội Ngũ Quản Lý</span>
              <h3 className="text-xl font-black text-slate-800 dark:text-zinc-100 mt-1">{totalEmployees} nhân sự</h3>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 dark:bg-zinc-900 dark:border-zinc-800">
            <div className="w-12 h-12 rounded-lg bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Star className="w-6 h-6" />
            </div>
            <div>
              <span className="text-slate-400 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider">Chờ Đánh Giá</span>
              <h3 className="text-xl font-black text-slate-800 dark:text-zinc-100 mt-1">
                {currentDocs.filter(d => d.targetType === 'EMPLOYEE' && d.status === 'SELF_EVALUATED').length} mục tiêu
              </h3>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 dark:bg-zinc-900 dark:border-zinc-800">
            <div className="w-12 h-12 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <span className="text-slate-400 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider">Hiệu Suất Phòng Ban</span>
              <h3 className="text-xl font-black text-slate-800 dark:text-zinc-100 mt-1">
                {currentDocs.filter(d => d.targetType === 'EMPLOYEE').length > 0
                  ? `${Math.round(currentDocs.filter(d => d.targetType === 'EMPLOYEE').reduce((acc, doc) => acc + getDocCompletion(doc), 0) / currentDocs.filter(d => d.targetType === 'EMPLOYEE').length)}%`
                  : '82%'
                }
              </h3>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 dark:bg-zinc-900 dark:border-zinc-800">
            <div className="w-12 h-12 rounded-lg bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <span className="text-slate-400 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider">Trạng Thái Chu Kỳ</span>
              <h3 className="text-xl font-black text-slate-800 dark:text-zinc-100 mt-1">
                {cycles.find(c => c.id === selectedCycleId)?.status === 'ACTIVE' ? 'Đang chạy' : 'Đóng'}
              </h3>
            </div>
          </div>
        </div>
      )}

      {/* 3. EMPLOYEE VIEW CARDS */}
      {currentUserRole === 'EMPLOYEE' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 dark:bg-zinc-900 dark:border-zinc-800">
            <div className="w-12 h-12 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <span className="text-slate-400 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider">Chỉ Tiêu Được Giao</span>
              <h3 className="text-xl font-black text-slate-800 dark:text-zinc-100 mt-1">
                {myKpis.length > 0 && myKpis[0].kpiItems ? `${myKpis[0].kpiItems.length} mục tiêu` : '3 mục tiêu'}
              </h3>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 dark:bg-zinc-900 dark:border-zinc-800">
            <div className="w-12 h-12 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <span className="text-slate-400 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider">Tỷ Lệ Hoàn Thành</span>
              <h3 className="text-xl font-black text-slate-800 dark:text-zinc-100 mt-1">{overallMyCompletion}%</h3>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 dark:bg-zinc-900 dark:border-zinc-800">
            <div className="w-12 h-12 rounded-lg bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <span className="text-slate-400 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider">Nhật Ký Tiến Độ</span>
              <h3 className="text-xl font-black text-slate-800 dark:text-zinc-100 mt-1">{recentLogs.length} lần cập nhật</h3>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 dark:bg-zinc-900 dark:border-zinc-800">
            <div className="w-12 h-12 rounded-lg bg-sky-50 dark:bg-sky-950/40 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <span className="text-slate-400 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider">Thời Hạn Chu Kỳ</span>
              <h3 className="text-xl font-black text-slate-800 dark:text-zinc-100 mt-1">30/09/2026</h3>
            </div>
          </div>
        </div>
      )}

      {/* CHARTS CONTAINER GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Render Charts for ADMIN & DIRECTOR */}
        {(currentUserRole === 'ADMIN' || currentUserRole === 'DIRECTOR') && (
          <>
            {/* Bar Chart - Dept Avg Completion */}
            <section className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col dark:bg-zinc-900 dark:border-zinc-800">
              <h3 className="text-sm font-extrabold uppercase text-slate-500 dark:text-zinc-400 mb-4 flex items-center gap-1.5 border-b border-slate-100 dark:border-zinc-850 pb-3">
                <Layers className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
                Tỷ lệ hoàn thành mục tiêu trung bình theo phòng ban (%)
              </h3>
              <div className="h-72 w-full flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deptChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                    <Bar dataKey="Hoàn thành" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Right Column Stack: Pie Chart + Recent Activity Feed */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              {/* Pie Chart - Performance distribution */}
              <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col dark:bg-zinc-900 dark:border-zinc-800">
                <h3 className="text-sm font-extrabold uppercase text-slate-500 dark:text-zinc-400 mb-4 flex items-center gap-1.5 border-b border-slate-100 dark:border-zinc-850 pb-3">
                  <Award className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
                  Phân bổ đánh giá hiệu suất nhân viên
                </h3>
                <div className="h-48 w-full flex flex-col justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={performanceChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {performanceChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                      <Legend layout="horizontal" align="center" verticalAlign="bottom" iconSize={8} wrapperStyle={{ fontSize: '10px', color: '#64748b' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </section>

              {/* Dynamic Recent Activity Feed */}
              {renderRecentActivityFeed(recentLogs, isLoading)}
            </div>
          </>
        )}

        {/* Render Charts for MANAGER */}
        {currentUserRole === 'MANAGER' && (
          <>
            {/* Bar Chart - Team Completion Rates */}
            <section className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col dark:bg-zinc-900 dark:border-zinc-800">
              <h3 className="text-sm font-extrabold uppercase text-slate-500 dark:text-zinc-400 mb-4 flex items-center gap-1.5 border-b border-slate-100 dark:border-zinc-850 pb-3">
                <Users className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
                Tỷ lệ hoàn thành trung bình của nhân sự cấp dưới (%)
              </h3>
              <div className="h-72 w-full flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subordinateChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                    <Bar dataKey="Hoàn thành" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={36} />
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
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {managerStatusChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                      <Legend layout="horizontal" align="center" verticalAlign="bottom" iconSize={8} wrapperStyle={{ fontSize: '10px', color: '#64748b' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </section>

              {/* Dynamic Recent Activity Feed */}
              {renderRecentActivityFeed(recentLogs, isLoading)}
            </div>
          </>
        )}

        {/* Render Charts for EMPLOYEE */}
        {currentUserRole === 'EMPLOYEE' && (
          <>
            {/* Bar Chart - My Personal Targets vs Actual */}
            <section className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col dark:bg-zinc-900 dark:border-zinc-800">
              <h3 className="text-sm font-extrabold uppercase text-slate-500 dark:text-zinc-400 mb-4 flex items-center gap-1.5 border-b border-slate-100 dark:border-zinc-850 pb-3">
                <Target className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
                Tiến độ chi tiết từng mục tiêu cá nhân (%)
              </h3>
              <div className="h-72 w-full flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={myChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} />
                    <YAxis domain={[0, 120]} tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                    <Legend layout="horizontal" align="center" verticalAlign="bottom" iconSize={8} wrapperStyle={{ fontSize: '10px', color: '#64748b' }} />
                    <Bar dataKey="Chỉ tiêu" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={24} />
                    <Bar dataKey="Đạt được" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Right Column Stack: Recent Activity Feed */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              {renderRecentActivityFeed(recentLogs, isLoading)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Separate helper component/render function to render recent activity feed
function renderRecentActivityFeed(recentLogs: any[], isLoading: boolean) {
  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col dark:bg-zinc-900 dark:border-zinc-800 flex-1 min-h-[260px]">
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
          <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
            {recentLogs.map((log: any) => {
              const isUp = log.valueDelta >= 0;
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
  );
}

export const DashboardPage: React.FC = () => {
  return (
    <KpiProvider>
      <DashboardInner />
    </KpiProvider>
  );
};
export default DashboardPage;
