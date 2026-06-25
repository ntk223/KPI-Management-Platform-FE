import React, { useMemo, useState } from 'react';
import { KpiProvider, useKpi } from '../features/kpi-dashboard';
import { useAuth } from '../features/auth';
import { Target, Award, Users, Layers, Activity, Star, Calendar } from 'lucide-react';
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

function DashboardInner() {
  const { currentUserRole, cycles, kpiDocuments, departments, progressLogs } = useKpi();
  const { user } = useAuth();
  const [selectedCycleId, setSelectedCycleId] = useState<number>(3); // Q3-2026 is ACTIVE

  const currentDocs = useMemo(() => {
    return kpiDocuments.filter(doc => doc.cycleId === selectedCycleId);
  }, [kpiDocuments, selectedCycleId]);

  // General counts & stats
  const totalEmployees = 3; // Nguyễn Văn AI, Lê Thị Sales, Trần QA
  const totalCycles = cycles.length;

  // 1. Chart Data 1: Avg KPI Completion % per Department (for Director / Admin)
  const deptChartData = useMemo(() => {
    return departments
      .filter(d => d.id !== 1) // exclude BGĐ
      .map(dept => {
        const deptDocs = currentDocs.filter(
          doc =>
            (doc.type === 'DEPARTMENT' && doc.targetId === dept.id) ||
            (doc.type === 'EMPLOYEE' && doc.parentDocId &&
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
          let completion = 0;
          if (doc.targetValue > 0) {
            if (doc.unit === 'ms' || doc.unit === 'Bug') {
              completion = doc.currentValue <= doc.targetValue ? 100 : (doc.targetValue / doc.currentValue) * 100;
            } else {
              completion = (doc.currentValue / doc.targetValue) * 100;
            }
          }
          totalCompletion += Math.min(100, Math.max(0, completion));
        });

        const avg = Math.round(totalCompletion / deptDocs.length);
        return { name: dept.name, 'Hoàn thành': avg };
      });
  }, [departments, currentDocs]);

  // 2. Chart Data 2: Employee Performance breakdown (Excellent, Good, Satisfactory)
  const performanceChartData = [
    { name: 'Xuất sắc', value: 5, color: '#6366f1' },
    { name: 'Tốt', value: 8, color: '#38bdf8' },
    { name: 'Đạt yêu cầu', value: 4, color: '#94a3b8' },
  ];

  // 3. Manager Subordinate Completion Rates Chart
  const subordinates = [
    { id: 101, name: 'Nguyễn Văn AI' },
    { id: 102, name: 'Lê Thị Sales' },
    { id: 103, name: 'Trần QA' }
  ];
  const subordinateChartData = useMemo(() => {
    return subordinates.map(sub => {
      const subKpis = currentDocs.filter(d => d.type === 'EMPLOYEE' && d.targetId === sub.id);
      let avgComp = 0;
      if (subKpis.length > 0) {
        let total = 0;
        subKpis.forEach(doc => {
          let comp = 0;
          if (doc.targetValue > 0) {
            if (doc.unit === 'ms' || doc.unit === 'Bug') {
              comp = doc.currentValue <= doc.targetValue ? 100 : (doc.targetValue / doc.currentValue) * 100;
            } else {
              comp = (doc.currentValue / doc.targetValue) * 100;
            }
          }
          total += Math.min(100, Math.max(0, comp));
        });
        avgComp = Math.round(total / subKpis.length);
      } else {
        avgComp = sub.id === 101 ? 88 : sub.id === 102 ? 93 : 50; // default mocks
      }
      return { name: sub.name, 'Hoàn thành': avgComp };
    });
  }, [currentDocs]);

  // Manager Subordinate KPI Status Breakdown (Pie Chart)
  const managerStatusChartData = useMemo(() => {
    const subDocs = currentDocs.filter(d => d.type === 'EMPLOYEE');
    const counts = { DRAFT: 0, IN_PROGRESS: 0, SELF_EVALUATED: 0, EVALUATED: 0 };
    subDocs.forEach(d => {
      if (counts[d.status] !== undefined) {
        counts[d.status]++;
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
  const personalEmpId = 102; // Lê Thị Sales
  const myKpis = currentDocs.filter(d => d.type === 'EMPLOYEE' && d.targetId === personalEmpId);
  const myChartData = useMemo(() => {
    if (myKpis.length === 0) {
      return [
        { name: 'Doanh số Q3', 'Đạt được': 110, 'Chỉ tiêu': 100 },
        { name: 'Khách hàng mới', 'Đạt được': 96, 'Chỉ tiêu': 100 },
        { name: 'SLA phản hồi', 'Đạt được': 100, 'Chỉ tiêu': 100 }
      ];
    }
    return myKpis.map(doc => {
      let progress = 0;
      if (doc.targetValue > 0) {
        if (doc.unit === 'ms' || doc.unit === 'Bug') {
          progress = doc.currentValue <= doc.targetValue ? 100 : Math.round((doc.targetValue / doc.currentValue) * 100);
        } else {
          progress = Math.round((doc.currentValue / doc.targetValue) * 100);
        }
      }
      return {
        name: doc.title.length > 20 ? doc.title.substring(0, 17) + '...' : doc.title,
        'Đạt được': progress,
        'Chỉ tiêu': 100
      };
    });
  }, [myKpis]);

  const overallMyCompletion = useMemo(() => {
    if (myKpis.length === 0) return 95; // default fallback
    let total = 0;
    myKpis.forEach(doc => {
      let comp = 0;
      if (doc.targetValue > 0) {
        if (doc.unit === 'ms' || doc.unit === 'Bug') {
          comp = doc.currentValue <= doc.targetValue ? 100 : (doc.targetValue / doc.currentValue) * 100;
        } else {
          comp = (doc.currentValue / doc.targetValue) * 100;
        }
      }
      total += Math.min(100, Math.max(0, comp));
    });
    return Math.round(total / myKpis.length);
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

          <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex flex-col gap-2 self-stretch md:self-auto min-w-[200px]">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Chu kỳ phân tích:</span>
            <select
              value={selectedCycleId}
              onChange={e => setSelectedCycleId(Number(e.target.value))}
              className="bg-slate-950 border border-slate-700 rounded-lg text-xs font-bold p-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {cycles.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
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
              <span className="text-slate-400 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider">Hiệu Suất Q3 Dự Kiến</span>
              <h3 className="text-xl font-black text-slate-800 dark:text-zinc-100 mt-1">86.4 %</h3>
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
              <h3 className="text-xl font-black text-slate-800 dark:text-zinc-100 mt-1">2 mục tiêu</h3>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 dark:bg-zinc-900 dark:border-zinc-800">
            <div className="w-12 h-12 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <span className="text-slate-400 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider">Đạt Chỉ Tiêu Q3</span>
              <h3 className="text-xl font-black text-slate-800 dark:text-zinc-100 mt-1">77 %</h3>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 dark:bg-zinc-900 dark:border-zinc-800">
            <div className="w-12 h-12 rounded-lg bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <span className="text-slate-400 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider">Trạng Thái Chu Kỳ</span>
              <h3 className="text-xl font-black text-slate-800 dark:text-zinc-100 mt-1">Đang chạy</h3>
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
              <h3 className="text-xl font-black text-slate-800 dark:text-zinc-100 mt-1">{myKpis.length || 3} mục tiêu</h3>
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
              <h3 className="text-xl font-black text-slate-800 dark:text-zinc-100 mt-1">{progressLogs.length} lần cập nhật</h3>
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

            {/* Pie Chart - Performance distribution */}
            <section className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col dark:bg-zinc-900 dark:border-zinc-800">
              <h3 className="text-sm font-extrabold uppercase text-slate-500 dark:text-zinc-400 mb-4 flex items-center gap-1.5 border-b border-slate-100 dark:border-zinc-850 pb-3">
                <Award className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
                Phân bổ đánh giá hiệu suất nhân viên
              </h3>
              <div className="h-72 w-full flex-1 flex flex-col justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={performanceChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {performanceChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                    <Legend layout="horizontal" align="center" verticalAlign="bottom" iconSize={8} wrapperStyle={{ fontSize: '11px', color: '#64748b' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </section>
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

            {/* Pie Chart - KPI Statuses */}
            <section className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col dark:bg-zinc-900 dark:border-zinc-800">
              <h3 className="text-sm font-extrabold uppercase text-slate-500 dark:text-zinc-400 mb-4 flex items-center gap-1.5 border-b border-slate-100 dark:border-zinc-850 pb-3">
                <Activity className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
                Phân bổ trạng thái mục tiêu đội ngũ
              </h3>
              <div className="h-72 w-full flex-1 flex flex-col justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={managerStatusChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
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

            {/* Recent Progress Logs count */}
            <section className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between dark:bg-zinc-900 dark:border-zinc-800">
              <h3 className="text-sm font-extrabold uppercase text-slate-500 dark:text-zinc-400 mb-4 flex items-center gap-1.5 border-b border-slate-100 dark:border-zinc-850 pb-3">
                <Activity className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
                Hoạt động cập nhật gần đây
              </h3>
              <div className="w-full flex-1 flex flex-col justify-center">
                <div className="text-center py-4">
                  <span className="text-[32px] font-black text-indigo-600 dark:text-indigo-400">+{progressLogs.filter(l => l.employeeName === 'Lê Thị Sales').length}</span>
                  <span className="block text-[11px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase mt-1">Cập nhật tiến độ chu kỳ này</span>
                </div>
                <div className="mt-2 space-y-2">
                  {progressLogs.slice(0, 2).map(log => (
                    <div key={log.id} className="p-2.5 bg-slate-50 dark:bg-zinc-950/40 border border-slate-150 dark:border-zinc-850 rounded-lg text-[10px] text-slate-500 dark:text-zinc-400">
                      <div className="flex justify-between font-bold text-slate-700 dark:text-zinc-200 mb-1">
                        <span className="truncate">{log.docTitle}</span>
                        <span className="text-indigo-600 dark:text-indigo-400">+{log.valueDelta.toLocaleString()}</span>
                      </div>
                      <p className="truncate italic">"{log.justificationText}"</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
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
