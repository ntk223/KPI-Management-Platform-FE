import React, { useState, useMemo } from 'react';
import { useKpi } from '../context/KpiContext';
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
import { Filter, Award, ChevronDown, ChevronRight, Target, Network, Layers } from 'lucide-react';

export const DirectorPanel: React.FC = () => {
  const { cycles, kpiDocuments, departments } = useKpi();
  const [selectedCycleId, setSelectedCycleId] = useState<number>(3); // Q3-2026 is ACTIVE

  // Filter documents based on cycle
  const currentDocs = useMemo(() => {
    return kpiDocuments.filter(doc => doc.cycleId === selectedCycleId);
  }, [kpiDocuments, selectedCycleId]);

  // 1. Chart Data 1: Avg KPI Completion % per Department
  const deptChartData = useMemo(() => {
    // For each department, calculate the average completion percent
    // completion % = (currentValue / targetValue) * 100 (clamped to 100 for exact / higher better unless lower better)
    const result = departments
      .filter(d => d.id !== 1) // exclude BGĐ
      .map(dept => {
        const deptDocs = currentDocs.filter(
          doc =>
            (doc.type === 'DEPARTMENT' && doc.targetId === dept.id) ||
            (doc.type === 'EMPLOYEE' && doc.parentDocId &&
             currentDocs.find(parent => parent.id === doc.parentDocId && parent.targetId === dept.id))
        );

        if (deptDocs.length === 0) {
          // Default mock values if no documents are found for a cycle
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
            completion = (doc.currentValue / doc.targetValue) * 100;
          }
          totalCompletion += Math.min(100, Math.max(0, completion)); // clamp between 0-100
        });

        const avg = Math.round(totalCompletion / deptDocs.length);
        return { name: dept.name, 'Hoàn thành': avg };
      });

    return result;
  }, [departments, currentDocs]);

  // 2. Chart Data 2: Employee Performance breakdown (Excellent, Good, Satisfactory)
  const performanceChartData = [
    { name: 'Xuất sắc (Excellent)', value: 5, color: '#6366f1' },
    { name: 'Tốt (Good)', value: 8, color: '#38bdf8' },
    { name: 'Đạt yêu cầu (Satisfactory)', value: 4, color: '#94a3b8' },
  ];

  // 3. Cascading Corporate Matrix State (Tree expanded nodes)
  const [expandedNodes, setExpandedNodes] = useState<Record<number, boolean>>({
    100: true, // Company Level
    200: true, // Sales Dept Level
    201: true, // Dev Dept Level
    202: true  // QA Dept Level
  });

  const toggleNode = (nodeId: number) => {
    setExpandedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  // Find cascading children helpers
  const companyDocs = useMemo(() => currentDocs.filter(d => d.type === 'COMPANY'), [currentDocs]);
  const getDeptDocsForCompany = (compDocId: number) => currentDocs.filter(d => d.type === 'DEPARTMENT' && d.parentDocId === compDocId);
  const getEmpDocsForDept = (deptDocId: number) => currentDocs.filter(d => d.type === 'EMPLOYEE' && d.parentDocId === deptDocId);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* ── Cycle Filter toolbar ── */}
      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-indigo-400" />
          <span className="text-sm font-bold uppercase tracking-wider text-slate-400">Bộ lọc Chu kỳ KPI:</span>
          <select
            value={selectedCycleId}
            onChange={e => setSelectedCycleId(Number(e.target.value))}
            className="bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold p-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {cycles.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="text-xs text-slate-400 font-semibold">
          Đang xem số liệu: <span className="text-indigo-400 font-extrabold">{cycles.find(c => c.id === selectedCycleId)?.name}</span>
        </div>
      </div>

      {/* ── Charts Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Bar Chart Panel */}
        <section className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <h3 className="text-sm font-extrabold uppercase text-slate-500 mb-4 flex items-center gap-1.5 border-b border-slate-100 pb-3">
            <Layers className="w-4.5 h-4.5 text-indigo-600" />
            Tỷ lệ hoàn thành mục tiêu trung bình theo phòng ban (%)
          </h3>
          <div className="h-64 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                <Bar dataKey="Hoàn thành" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Pie Chart Panel */}
        <section className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <h3 className="text-sm font-extrabold uppercase text-slate-500 mb-4 flex items-center gap-1.5 border-b border-slate-100 pb-3">
            <Award className="w-4.5 h-4.5 text-indigo-600" />
            Phân bổ xếp loại đánh giá hiệu suất nhân viên
          </h3>
          <div className="h-64 w-full flex-1 flex flex-col justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={performanceChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
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
      </div>

      {/* ── Corporate Document Matrix (Hierarchy Cascade Grid) ── */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-sm font-extrabold uppercase text-slate-500 mb-4 flex items-center gap-1.5 border-b border-slate-100 pb-3">
          <Network className="w-4.5 h-4.5 text-indigo-600" />
          Ma trận mục tiêu tập đoàn & Liên kết phân rã (Cascading Goals)
        </h3>

        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
          <div className="bg-slate-50 p-4 border-b border-slate-200 grid grid-cols-12 text-xs font-bold uppercase text-slate-600 tracking-wider">
            <div className="col-span-6 md:col-span-7">Tên mục tiêu / Phân rã mục tiêu</div>
            <div className="col-span-3 md:col-span-2 text-center">Tiến độ (Hiện tại / Chỉ tiêu)</div>
            <div className="col-span-2 text-center hidden md:block">Trọng số</div>
            <div className="col-span-3 md:col-span-1 text-right">Trạng thái</div>
          </div>

          <div className="divide-y divide-slate-200">
            {companyDocs.map(companyDoc => {
              const deptDocs = getDeptDocsForCompany(companyDoc.id);
              const isCompExpanded = !!expandedNodes[companyDoc.id];

              return (
                <div key={companyDoc.id}>
                  {/* Company Row */}
                  <div className="p-4 grid grid-cols-12 items-center bg-indigo-50/30 hover:bg-indigo-50/50 transition-colors">
                    <div className="col-span-6 md:col-span-7 flex items-center gap-2">
                      <button onClick={() => toggleNode(companyDoc.id)} className="text-slate-400 hover:text-indigo-600 p-0.5 transition-colors">
                        {isCompExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                      <Target className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                      <span className="font-extrabold text-slate-800 text-sm">{companyDoc.title}</span>
                      <span className="text-[9px] bg-indigo-600 text-white font-extrabold px-1.5 py-0.5 rounded">TẬP ĐOÀN</span>
                    </div>
                    <div className="col-span-3 md:col-span-2 text-center text-xs font-bold text-slate-700">
                      {companyDoc.currentValue} / {companyDoc.targetValue} {companyDoc.unit}
                    </div>
                    <div className="col-span-2 text-center text-xs font-semibold text-slate-500 hidden md:block">
                      {companyDoc.weight ? (companyDoc.weight <= 1 ? Math.round(companyDoc.weight * 100) : companyDoc.weight) : 0}%
                    </div>
                    <div className="col-span-3 md:col-span-1 text-right">
                      <span className="inline-flex px-2 py-0.5 text-[10px] font-extrabold uppercase rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {companyDoc.status}
                      </span>
                    </div>
                  </div>

                  {/* Department level nested under Company */}
                  {isCompExpanded && deptDocs.map(deptDoc => {
                    const empDocs = getEmpDocsForDept(deptDoc.id);
                    const isDeptExpanded = !!expandedNodes[deptDoc.id];

                    return (
                      <div key={deptDoc.id} className="divide-y divide-slate-100">
                        {/* Department Row */}
                        <div className="p-4 grid grid-cols-12 items-center pl-10 bg-slate-50/40 hover:bg-slate-50 transition-colors">
                          <div className="col-span-6 md:col-span-7 flex items-center gap-2">
                            <button onClick={() => toggleNode(deptDoc.id)} className="text-slate-400 hover:text-indigo-600 p-0.5 transition-colors">
                              {isDeptExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </button>
                            <Network className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                            <span className="font-bold text-slate-700 text-xs">{deptDoc.title}</span>
                            <span className="text-[8px] bg-blue-100 text-blue-700 font-extrabold px-1 rounded border border-blue-200">PHÒNG</span>
                          </div>
                          <div className="col-span-3 md:col-span-2 text-center text-xs font-semibold text-slate-600">
                            {deptDoc.currentValue.toLocaleString()} / {deptDoc.targetValue.toLocaleString()} {deptDoc.unit}
                          </div>
                          <div className="col-span-2 text-center text-xs font-semibold text-slate-400 hidden md:block">
                            {deptDoc.weight ? (deptDoc.weight <= 1 ? Math.round(deptDoc.weight * 100) : deptDoc.weight) : 0}%
                          </div>
                          <div className="col-span-3 md:col-span-1 text-right">
                            <span className="inline-flex px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-blue-50 text-blue-700 border border-blue-200">
                              {deptDoc.status}
                            </span>
                          </div>
                        </div>

                        {/* Employee Level goals nested under Department */}
                        {isDeptExpanded && empDocs.map(empDoc => (
                          <div key={empDoc.id} className="p-3.5 grid grid-cols-12 items-center pl-20 bg-white hover:bg-slate-50/30 transition-colors">
                            <div className="col-span-6 md:col-span-7 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 ml-4 flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-600 text-xs truncate">{empDoc.title}</p>
                                <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                                  Giao cho: <span className="text-slate-600 font-bold">{empDoc.employeeName}</span> ({empDoc.positionName})
                                </p>
                              </div>
                            </div>
                            <div className="col-span-3 md:col-span-2 text-center text-xs font-medium text-slate-500">
                              {empDoc.currentValue.toLocaleString()} / {empDoc.targetValue.toLocaleString()} {empDoc.unit}
                            </div>
                            <div className="col-span-2 text-center text-xs font-medium text-slate-400 hidden md:block">
                              {empDoc.weight ? (empDoc.weight <= 1 ? Math.round(empDoc.weight * 100) : empDoc.weight) : 0}%
                            </div>
                            <div className="col-span-3 md:col-span-1 text-right">
                              <span className={`inline-flex px-1.5 py-0.25 text-[8px] font-bold uppercase rounded ${
                                empDoc.status === 'SELF_EVALUATED' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                empDoc.status === 'EVALUATED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                'bg-slate-50 text-slate-500 border border-slate-200'
                              }`}>
                                {empDoc.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};
