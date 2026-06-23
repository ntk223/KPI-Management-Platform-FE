import React, { useState, useMemo } from 'react';
import { KpiProvider, useKpi } from '../features/kpi-dashboard';
import {
  Target,
  Network,
  Users,
  Briefcase,
  CheckCircle,
  FileText,
  Bot,
  Sliders,
  ChevronDown,
  ChevronRight,
  Filter
} from 'lucide-react';
import { DocStatus } from '../features/kpi-dashboard';

function KpisDepartmentInner() {
  const {
    currentUserRole,
    cycles,
    kpiDocuments,
    applyPositionBundleToEmployee,
    evaluateEmployee
  } = useKpi();

  const [selectedCycleId, setSelectedCycleId] = useState<number>(3); // Q3-2026 is ACTIVE
  const currentDocs = useMemo(() => {
    return kpiDocuments.filter(doc => doc.cycleId === selectedCycleId);
  }, [kpiDocuments, selectedCycleId]);

  // --- DIRECTOR & ADMIN VIEW: Cascading Goals Tree ---
  const [expandedNodes, setExpandedNodes] = useState<Record<number, boolean>>({
    100: true, // Company Level
    200: true, // Sales Dept Level
    201: true, // Dev Dept Level
    202: true  // QA Dept Level
  });

  const toggleNode = (nodeId: number) => {
    setExpandedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const companyDocs = useMemo(() => currentDocs.filter(d => d.type === 'COMPANY'), [currentDocs]);
  const getDeptDocsForCompany = (compDocId: number) => currentDocs.filter(d => d.type === 'DEPARTMENT' && d.parentDocId === compDocId);
  const getEmpDocsForDept = (deptDocId: number) => currentDocs.filter(d => d.type === 'EMPLOYEE' && d.parentDocId === deptDocId);

  // --- MANAGER VIEW: Subordinate evaluation ---
  const subordinates = [
    { id: 101, name: 'Nguyễn Văn AI', positionId: 1, positionName: 'Kỹ sư AI chuyên nghiệp', parentDocId: 201 },
    { id: 102, name: 'Lê Thị Sales', positionId: 5, positionName: 'Nhân viên kinh doanh', parentDocId: 200 },
    { id: 103, name: 'Trần QA', positionId: 3, positionName: 'Chuyên viên kiểm thử QA', parentDocId: 202 },
  ];

  const [selectedSubId, setSelectedSubId] = useState<number>(102); // Lê Thị Sales
  const [managerFilterStatus, setManagerFilterStatus] = useState<DocStatus | 'ALL'>('ALL');
  const [evalScores, setEvalScores] = useState<Record<number, { managerScore: number; finalScore: number }>>({});

  const selectedSub = subordinates.find(s => s.id === selectedSubId)!;
  const subDocs = currentDocs.filter(d => d.type === 'EMPLOYEE' && d.targetId === selectedSubId);

  const filteredSubordinates = subordinates.filter(sub => {
    if (managerFilterStatus === 'ALL') return true;
    const docs = currentDocs.filter(d => d.type === 'EMPLOYEE' && d.targetId === sub.id);
    if (docs.length === 0 && managerFilterStatus === 'DRAFT') return true;
    return docs.some(d => d.status === managerFilterStatus);
  });

  const handleApplyBundle = () => {
    applyPositionBundleToEmployee(
      selectedSub.id,
      selectedSub.name,
      selectedSub.positionId,
      selectedCycleId,
      selectedSub.parentDocId
    );
    alert('Áp dụng mẫu định mức chức danh thành công!');
  };

  const handleSaveEvaluation = (docId: number) => {
    const scores = evalScores[docId] || { managerScore: 85, finalScore: 85 };
    evaluateEmployee(docId, scores.managerScore, scores.finalScore);
    alert('Phê duyệt và lưu kết quả đánh giá KPI thành công!');
  };

  const handleScoreChange = (docId: number, field: 'managerScore' | 'finalScore', val: number) => {
    setEvalScores(prev => ({
      ...prev,
      [docId]: {
        ...(prev[docId] || { managerScore: 80, finalScore: 80 }),
        [field]: val
      }
    }));
  };

  const getAiRecommendation = (doc: any) => {
    if (doc.targetValue === 0) return 'Chỉ tiêu không hợp lệ.';
    const progressRatio = doc.currentValue / doc.targetValue;
    if (doc.unit === 'ms' || doc.unit === 'Bug') {
      if (doc.currentValue <= doc.targetValue) {
        return `Ưu tú: Kết quả thực tế (${doc.currentValue}) đạt yêu cầu chỉ tiêu tối đa (${doc.targetValue}). Đề xuất đánh giá 95-100 điểm.`;
      }
      return `Cảnh báo: Chỉ số vượt ngưỡng tối đa cho phép. Khuyến nghị quản lý trao đổi 1-1 hỗ trợ nhân sự khắc phục.`;
    }
    if (progressRatio >= 1.0) {
      return `Hoàn thành xuất sắc: Đạt ${Math.round(progressRatio * 100)}% chỉ tiêu. Đề xuất đánh giá 90-100 điểm.`;
    } else if (progressRatio >= 0.75) {
      return `Hoàn thành tốt: Đạt ${Math.round(progressRatio * 100)}% chỉ tiêu. Đề xuất chấm điểm 80-89.`;
    } else {
      return `Chưa đạt tiến độ: Chỉ mới đạt ${Math.round(progressRatio * 100)}%. Đề xuất quản lý hỗ trợ đôn đốc công việc.`;
    }
  };

  // Render check
  if (currentUserRole !== 'ADMIN' && currentUserRole !== 'DIRECTOR' && currentUserRole !== 'MANAGER') {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 italic shadow-sm">
        Bạn không có quyền truy cập trang thông tin KPI phòng ban này.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Network className="w-5 h-5 text-indigo-600" />
            Quản lý KPI Cấp Phòng Ban & Phân Rã Mục Tiêu
          </h2>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            {currentUserRole === 'MANAGER' 
              ? 'Đánh giá, phê duyệt KPIs cho các nhân sự cấp dưới trực thuộc quản lý'
              : 'Xem chi tiết ma trận cascading, phân rã mục tiêu toàn tập đoàn'}
          </p>
        </div>
        
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-lg border border-slate-250">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[10px] font-bold text-slate-500 uppercase">Chu kỳ:</span>
          <select
            value={selectedCycleId}
            onChange={e => setSelectedCycleId(Number(e.target.value))}
            className="bg-white border border-slate-200 rounded text-xs font-bold p-1 text-slate-700 focus:outline-none"
          >
            {cycles.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* --- RENDER 1: CASCADING GOALS TREE FOR ADMIN & DIRECTOR --- */}
      {(currentUserRole === 'ADMIN' || currentUserRole === 'DIRECTOR') && (
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-sm font-extrabold uppercase text-slate-500 mb-4 flex items-center gap-1.5 border-b border-slate-100 pb-3">
            <Network className="w-4.5 h-4.5 text-indigo-600" />
            Ma trận mục tiêu tập đoàn & Liên kết phân rã (Cascading Goals)
          </h3>

          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
            <div className="bg-slate-50 p-4 border-b border-slate-200 grid grid-cols-12 text-xs font-bold uppercase text-slate-600 tracking-wider">
              <div className="col-span-6 md:col-span-7">Tên mục tiêu / Liên kết phân rã</div>
              <div className="col-span-3 md:col-span-2 text-center">Tiến độ thực tế</div>
              <div className="col-span-2 text-center hidden md:block">Trọng số</div>
              <div className="col-span-3 md:col-span-1 text-right">Trạng thái</div>
            </div>

            <div className="divide-y divide-slate-200">
              {companyDocs.map(companyDoc => {
                const deptDocs = getDeptDocsForCompany(companyDoc.id);
                const isCompExpanded = !!expandedNodes[companyDoc.id];

                return (
                  <div key={companyDoc.id}>
                    <div className="p-4 grid grid-cols-12 items-center bg-indigo-50/20 hover:bg-indigo-50/40 transition-colors">
                      <div className="col-span-6 md:col-span-7 flex items-center gap-2">
                        <button onClick={() => toggleNode(companyDoc.id)} className="text-slate-400 hover:text-indigo-600 p-0.5">
                          {isCompExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                        <Target className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                        <span className="font-extrabold text-slate-800 text-sm">{companyDoc.title}</span>
                        <span className="text-[9px] bg-indigo-600 text-white font-extrabold px-1.5 py-0.5 rounded">TẬP ĐOÀN</span>
                      </div>
                      <div className="col-span-3 md:col-span-2 text-center text-xs font-bold text-slate-700">
                        {companyDoc.currentValue}% / {companyDoc.targetValue}%
                      </div>
                      <div className="col-span-2 text-center text-xs font-semibold text-slate-500 hidden md:block">
                        {companyDoc.weight}%
                      </div>
                      <div className="col-span-3 md:col-span-1 text-right">
                        <span className="inline-flex px-2 py-0.5 text-[9px] font-extrabold uppercase rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {companyDoc.status}
                        </span>
                      </div>
                    </div>

                    {isCompExpanded && deptDocs.map(deptDoc => {
                      const empDocs = getEmpDocsForDept(deptDoc.id);
                      const isDeptExpanded = !!expandedNodes[deptDoc.id];

                      return (
                        <div key={deptDoc.id} className="divide-y divide-slate-100">
                          <div className="p-4 grid grid-cols-12 items-center pl-10 bg-slate-50/30 hover:bg-slate-50 transition-colors">
                            <div className="col-span-6 md:col-span-7 flex items-center gap-2">
                              <button onClick={() => toggleNode(deptDoc.id)} className="text-slate-400 hover:text-indigo-600 p-0.5">
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
                              {deptDoc.weight}%
                            </div>
                            <div className="col-span-3 md:col-span-1 text-right">
                              <span className="inline-flex px-1.5 py-0.5 text-[8px] font-bold uppercase rounded bg-blue-50 text-blue-700 border border-blue-200">
                                {deptDoc.status}
                              </span>
                            </div>
                          </div>

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
                                {empDoc.weight}%
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
      )}

      {/* --- RENDER 2: SUBORDINATE GRADING FOR MANAGER --- */}
      {currentUserRole === 'MANAGER' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Subordinate Selection Panel */}
          <aside className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <Users className="w-4.5 h-4.5 text-indigo-600" />
                Danh sách nhân sự cấp dưới
              </h3>
            </div>

            <div className="flex flex-wrap gap-1">
              {(['ALL', 'DRAFT', 'IN_PROGRESS', 'SELF_EVALUATED', 'EVALUATED'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => setManagerFilterStatus(status)}
                  className={`px-2 py-1 text-[9px] font-bold rounded border uppercase ${
                    managerFilterStatus === status
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {status === 'ALL' ? 'Tất cả' : status}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {filteredSubordinates.map(sub => {
                const subKpis = kpiDocuments.filter(d => d.type === 'EMPLOYEE' && d.targetId === sub.id && d.cycleId === selectedCycleId);
                const hasEvaluated = subKpis.length > 0 && subKpis.every(d => d.status === 'EVALUATED');
                const hasSelfEvaluated = subKpis.length > 0 && subKpis.some(d => d.status === 'SELF_EVALUATED');

                return (
                  <button
                    key={sub.id}
                    onClick={() => setSelectedSubId(sub.id)}
                    className={`w-full p-3.5 rounded-xl border text-left transition-all flex flex-col gap-1.5 ${
                      selectedSubId === sub.id
                        ? 'bg-indigo-50/55 border-indigo-300 text-indigo-900 ring-2 ring-indigo-50'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="font-bold text-xs text-slate-800">{sub.name}</span>
                      {subKpis.length === 0 ? (
                        <span className="px-1.5 py-0.5 text-[8px] font-extrabold bg-slate-100 text-slate-400 border border-slate-200 rounded">
                          NO BUNDLE
                        </span>
                      ) : hasEvaluated ? (
                        <span className="px-1.5 py-0.5 text-[8px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
                          ĐÃ ĐÁNH GIÁ
                        </span>
                      ) : hasSelfEvaluated ? (
                        <span className="px-1.5 py-0.5 text-[8px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200 rounded">
                          TỰ ĐÁNH GIÁ
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 text-[8px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 rounded">
                          ĐANG CHẠY
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold w-full">
                      <span className="flex items-center gap-0.5"><Briefcase className="w-3.5 h-3.5" /> {sub.positionName}</span>
                      <span>{subKpis.length} KPIs</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Subordinate KPI Evaluation Screen */}
          <main className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  KPIs của nhân sự: <span className="text-indigo-600 font-extrabold">{selectedSub.name}</span>
                </h2>
                <p className="text-[11px] text-slate-400 font-medium">Chức vụ: {selectedSub.positionName}</p>
              </div>

              {subDocs.length === 0 && (
                <button
                  onClick={handleApplyBundle}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-[0.98]"
                >
                  <Sliders className="w-3.5 h-3.5" /> Định mức chức danh
                </button>
              )}
            </div>

            <div className="space-y-6">
              {subDocs.map(doc => {
                const isSelfEvaluated = doc.status === 'SELF_EVALUATED';
                const isEvaluated = doc.status === 'EVALUATED';
                const isProgressing = doc.status === 'IN_PROGRESS';

                return (
                  <div key={doc.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
                    <div className="p-4 bg-slate-50/70 flex justify-between items-start gap-4">
                      <div>
                        <h4 className="font-bold text-slate-800 text-xs">{doc.title}</h4>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">Trọng số: {doc.weight}%</p>
                      </div>
                      <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded uppercase ${
                        isEvaluated ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        isSelfEvaluated ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}>
                        {doc.status}
                      </span>
                    </div>

                    <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Tiến trình chỉ tiêu</span>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <span className="block text-[9px] font-semibold text-slate-400">CHỈ TIÊU</span>
                            <span className="font-bold text-slate-700">{doc.targetValue.toLocaleString()} {doc.unit}</span>
                          </div>
                          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <span className="block text-[9px] font-semibold text-slate-400">THỰC TẾ</span>
                            <span className="font-bold text-indigo-600">{doc.currentValue.toLocaleString()} {doc.unit}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 border-t md:border-t-0 md:border-l md:border-r border-slate-100 md:px-4">
                        <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Minh chứng & Báo cáo</span>
                        {doc.proofText ? (
                          <div className="text-xs text-slate-600 leading-normal space-y-1">
                            <p className="bg-slate-50/50 p-2 rounded-lg border border-slate-100 text-[11px] font-medium">{doc.proofText}</p>
                            {doc.proofFile && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer">
                                <FileText className="w-3.5 h-3.5" /> {doc.proofFile}
                              </span>
                            )}
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-400 italic">Chưa có báo cáo minh chứng.</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Điểm số tự đánh giá</span>
                        {doc.selfScore ? (
                          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500">Tự chấm:</span>
                            <span className="text-base font-extrabold text-amber-700">{doc.selfScore} / 100</span>
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-400 italic py-2">Chưa tự đánh giá.</p>
                        )}
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 border-t border-slate-100">
                      <div className="flex gap-2">
                        <Bot className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-extrabold text-indigo-700 uppercase tracking-wider block">Gợi ý AI Assistant</span>
                          <p className="text-[11px] text-slate-600 mt-1 leading-relaxed italic">{getAiRecommendation(doc)}</p>
                        </div>
                      </div>
                    </div>

                    {(isSelfEvaluated || isEvaluated || isProgressing) && (
                      <div className="p-4 bg-white border-t border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                          <div className="flex items-center gap-2">
                            <label className="text-xs font-bold text-slate-500 uppercase whitespace-nowrap">Đại diện quản lý chấm:</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              disabled={isEvaluated}
                              value={evalScores[doc.id]?.managerScore ?? doc.managerScore ?? 80}
                              onChange={e => handleScoreChange(doc.id, 'managerScore', Number(e.target.value))}
                              className="w-16 p-1.5 border border-slate-200 rounded-lg text-xs font-extrabold text-slate-800 text-center focus:outline-none bg-slate-50"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-xs font-bold text-slate-500 uppercase whitespace-nowrap">Thống nhất:</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              disabled={isEvaluated}
                              value={evalScores[doc.id]?.finalScore ?? doc.finalScore ?? 80}
                              onChange={e => handleScoreChange(doc.id, 'finalScore', Number(e.target.value))}
                              className="w-16 p-1.5 border border-slate-200 rounded-lg text-xs font-extrabold text-indigo-700 text-center focus:outline-none bg-slate-50"
                            />
                          </div>
                        </div>

                        {!isEvaluated ? (
                          <button
                            onClick={() => handleSaveEvaluation(doc.id)}
                            className="w-full md:w-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all shadow-md active:scale-[0.98]"
                          >
                            Xác nhận lưu đánh giá
                          </button>
                        ) : (
                          <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 shadow-sm ml-auto">
                            <CheckCircle className="w-4 h-4" /> Đã duyệt điểm số
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {subDocs.length === 0 && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center text-slate-400 italic">
                  Chưa phân bổ KPIs cho nhân viên này trong chu kỳ hiện tại. Vui lòng bấm áp dụng định mức chức danh.
                </div>
              )}
            </div>
          </main>
        </div>
      )}
    </div>
  );
}

export const KpisDepartmentPage: React.FC = () => {
  return (
    <KpiProvider>
      <KpisDepartmentInner />
    </KpiProvider>
  );
};
export default KpisDepartmentPage;
