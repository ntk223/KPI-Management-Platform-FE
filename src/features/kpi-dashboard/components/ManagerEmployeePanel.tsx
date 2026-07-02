import React, { useState } from 'react';
import { useKpi } from '../context/KpiContext';
import { KpiDocument, DocStatus } from '../data/mockData';
import {
  User,
  Users,
  Briefcase,
  FileCheck,
  CheckCircle,
  FileText,
  Bot,
  Sliders,
  Send,
  Target,
  Paperclip,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { KpiAttachmentUploader } from '../../kpi-document';
import { useToast } from '../../../context';

export const ManagerEmployeePanel: React.FC = () => {
  const toast = useToast();
  const {
    currentUserRole,
    managerViewMode,
    setManagerViewMode,
    kpiDocuments,
    cycles,
    applyPositionBundleToEmployee,
    updateKpiDocumentProgress,
    submitSelfEvaluation,
    evaluateEmployee
  } = useKpi();

  const activeCycle = cycles.find(c => c.id === 3) || cycles[2]; // Active Cycle Q3-2026

  // Subordinate employees mock database
  const subordinates = [
    { id: 101, name: 'Nguyễn Văn AI', positionId: 1, positionName: 'Kỹ sư AI chuyên nghiệp', parentDocId: 201 },
    { id: 102, name: 'Lê Thị Sales', positionId: 5, positionName: 'Nhân viên kinh doanh', parentDocId: 200 },
    { id: 103, name: 'Trần QA', positionId: 3, positionName: 'Chuyên viên kiểm thử QA', parentDocId: 202 },
  ];

  // ─── MANAGER MODE STATE ────────────────────────────────────────────────────────
  const [selectedSubId, setSelectedSubId] = useState<number>(102); // Lê Thị Sales
  const [managerFilterStatus, setManagerFilterStatus] = useState<DocStatus | 'ALL'>('ALL');
  
  // Evaluation values state
  const [evalScores, setEvalScores] = useState<Record<number, { managerScore: number; finalScore: number }>>({});
  
  // Selected subordinate information
  const selectedSub = subordinates.find(s => s.id === selectedSubId)!;
  const subDocs = kpiDocuments.filter(d => d.type === 'EMPLOYEE' && d.targetId === selectedSubId);

  // Subordinate filter matching
  const filteredSubordinates = subordinates.filter(sub => {
    if (managerFilterStatus === 'ALL') return true;
    const docs = kpiDocuments.filter(d => d.type === 'EMPLOYEE' && d.targetId === sub.id);
    if (docs.length === 0 && managerFilterStatus === 'DRAFT') return true;
    return docs.some(d => d.status === managerFilterStatus);
  });

  // Apply Bundle Handler
  const handleApplyBundle = () => {
    applyPositionBundleToEmployee(
      selectedSub.id,
      selectedSub.name,
      selectedSub.positionId,
      3, // cycle Q3
      selectedSub.parentDocId
    );
  };

  // Evaluation Save Handler
  const handleSaveEvaluation = (docId: number) => {
    const scores = evalScores[docId] || { managerScore: 85, finalScore: 85 };
    evaluateEmployee(docId, scores.managerScore, scores.finalScore);
    toast.success('Đánh giá mục tiêu thành công!');
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

  // Generate simulated AI suggestions dynamically based on actual vs target progress
  const getAiRecommendation = (doc: KpiDocument) => {
    if (doc.targetValue === 0) return 'Dữ liệu chỉ tiêu chưa hợp lệ.';
    const progressRatio = doc.currentValue / doc.targetValue;
    if (doc.unit === 'ms' || doc.unit === 'Bug') {
      // Lower is better
      if (doc.currentValue <= doc.targetValue) {
        return `Uu tú: Kết quả thực tế (${doc.currentValue}) đạt yêu cầu chỉ tiêu tối đa (${doc.targetValue}). Đề xuất đánh giá 95-100 điểm.`;
      }
      return `Cảnh báo: Chỉ số vượt ngưỡng chỉ tiêu tối đa cho phép. Cần hỗ trợ tối ưu quy trình code hoặc kiểm thử để kiểm soát chất lượng kỹ lưỡng hơn.`;
    }
    // Higher is better
    if (progressRatio >= 1.0) {
      return `Hoàn thành xuất sắc: Đạt ${Math.round(progressRatio * 100)}% chỉ tiêu đề ra. Đề xuất khen thưởng và thiết lập KPIs thử thách hơn cho chu kỳ tới.`;
    } else if (progressRatio >= 0.75) {
      return `Hoàn thành tốt: Đạt ${Math.round(progressRatio * 100)}%. Nhân viên có nỗ lực cao, đề xuất chấm điểm từ 80-89.`;
    } else {
      return `Chưa đạt tiến độ: Chỉ mới đạt ${Math.round(progressRatio * 100)}%. Khuyến nghị quản lý trực tiếp trao đổi 1-1, tổ chức đào tạo hoặc kèm cặp thêm để thúc đẩy hiệu quả.`;
    }
  };

  // ─── PERSONAL EMPLOYEE MODE STATE ──────────────────────────────────────────────
  // Mock current employee is Lê Thị Sales (Employee ID: 102)
  const activeEmpId = 102;
  const myDocs = kpiDocuments.filter(d => d.type === 'EMPLOYEE' && d.targetId === activeEmpId);

  // Progress Logging Form
  const [selectedMyDocId, setSelectedMyDocId] = useState<number>(myDocs[0]?.id || 302);
  const [valueDelta, setValueDelta] = useState<number>(10);
  const [justification, setJustification] = useState<string>('');

  // Self Evaluation score values
  const [selfScores, setSelfScores] = useState<Record<number, number>>({});
  const [selfComments, setSelfComments] = useState<Record<number, string>>({});

  // Attachment panel expanded state per KPI item (manager view)
  const [expandedAttachments, setExpandedAttachments] = useState<Record<number, boolean>>({});
  const toggleAttachment = (docId: number) =>
    setExpandedAttachments(prev => ({ ...prev, [docId]: !prev[docId] }));

  const handleLogProgressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!justification.trim()) {
      toast.error('Vui lòng nhập giải trình tiến độ');
      return;
    }
    updateKpiDocumentProgress(selectedMyDocId, valueDelta, justification.trim(), undefined);
    setJustification('');
    toast.success('Cập nhật nhật ký tiến độ KPI thành công!');
  };

  const handleSelfEvalSubmit = (docId: number) => {
    const score = selfScores[docId] || 90;
    const comment = selfComments[docId] || '';
    submitSelfEvaluation(docId, score, comment);
    toast.success('Gửi tự đánh giá mục tiêu thành công!');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ── Contextual View Switcher Header ── */}
      {currentUserRole === 'MANAGER' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-center text-indigo-600">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Góc làm việc quản lý (Dual-Role Workspace)</h3>
              <p className="text-[11px] text-slate-400 font-semibold">Tự động kế thừa và chuyển đổi giữa vai trò quản trị nhóm và tự quản lý bản thân</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2.5 bg-slate-100 p-1 rounded-xl border border-slate-200 self-stretch sm:self-auto">
            <button
              onClick={() => setManagerViewMode('MANAGER_VIEW')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                managerViewMode === 'MANAGER_VIEW'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className="w-3.5 h-3.5" /> Chế độ Đánh giá Đội ngũ
            </button>
            <button
              onClick={() => setManagerViewMode('PERSONAL_VIEW')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                managerViewMode === 'PERSONAL_VIEW'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <User className="w-3.5 h-3.5" /> Chế độ KPI Cá nhân
            </button>
          </div>
        </div>
      )}

      {/* ── MANAGER VIEW MODE ── */}
      {managerViewMode === 'MANAGER_VIEW' && currentUserRole === 'MANAGER' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Subordinate Selection Panel */}
          <aside className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <Users className="w-4.5 h-4.5 text-indigo-600" />
                Danh sách nhân viên cấp dưới
              </h3>
            </div>

            {/* Filter buttons */}
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

            {/* Subordinate List */}
            <div className="space-y-2">
              {filteredSubordinates.map(sub => {
                const subKpis = kpiDocuments.filter(d => d.type === 'EMPLOYEE' && d.targetId === sub.id);
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
                      <span className="flex items-center gap-0.5"><Briefcase className="w-3 h-3" /> {sub.positionName}</span>
                      <span>{subKpis.length} KPIs</span>
                    </div>
                  </button>
                );
              })}
              {filteredSubordinates.length === 0 && (
                <div className="text-center py-6 text-xs text-slate-400 italic">
                  Không có nhân viên phù hợp bộ lọc
                </div>
              )}
            </div>
          </aside>

          {/* Subordinate KPI Evaluation Screen */}
          <main className="lg:col-span-8 space-y-6">
            {/* Action Bar */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  KPIs của nhân viên: <span className="text-indigo-600 font-extrabold">{selectedSub.name}</span>
                </h2>
                <p className="text-[11px] text-slate-400 font-medium">Chức danh công việc: {selectedSub.positionName}</p>
              </div>

              {subDocs.length === 0 && (
                <button
                  onClick={handleApplyBundle}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/10 active:scale-[0.98]"
                >
                  <Sliders className="w-3.5 h-3.5" /> Áp dụng cấu hình định mức chức danh
                </button>
              )}
            </div>

            {/* KPIs Grid List */}
            <div className="space-y-6">
              {subDocs.map(doc => {
                const isSelfEvaluated = doc.status === 'SELF_EVALUATED';
                const isEvaluated = doc.status === 'EVALUATED';
                const isProgressing = doc.status === 'IN_PROGRESS';

                return (
                  <div key={doc.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
                    {/* Header */}
                    <div className="p-4 bg-slate-50/70 flex justify-between items-start gap-4">
                      <div>
                        <h4 className="font-bold text-slate-800 text-xs">{doc.title}</h4>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">Trọng số đóng góp: {doc.weight ? (doc.weight <= 1 ? Math.round(doc.weight * 100) : doc.weight) : 0}%</p>
                      </div>
                      <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded uppercase ${
                        isEvaluated ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        isSelfEvaluated ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}>
                        {doc.status}
                      </span>
                    </div>

                    {/* Progress details */}
                    <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Left: values */}
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

                      {/* Middle: Proof text & attachments toggle */}
                      <div className="space-y-2 border-t md:border-t-0 md:border-l md:border-r border-slate-100 md:px-4">
                        <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Minh chứng & Giải trình</span>
                        {doc.proofText ? (
                          <p className="bg-slate-50/50 p-2 rounded-lg border border-slate-100 text-[11px] font-medium text-slate-600">{doc.proofText}</p>
                        ) : (
                          <p className="text-[11px] text-slate-400 italic">Chưa có giải trình văn bản.</p>
                        )}
                        {/* Attachments accordion for manager */}
                        <button
                          type="button"
                          onClick={() => toggleAttachment(doc.id)}
                          className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                        >
                          <Paperclip className="w-3.5 h-3.5" />
                          Xem minh chứng đính kèm
                          {expandedAttachments[doc.id]
                            ? <ChevronUp className="w-3 h-3" />
                            : <ChevronDown className="w-3 h-3" />
                          }
                        </button>
                        {expandedAttachments[doc.id] && (
                          <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <KpiAttachmentUploader
                              kpiItemId={doc.id}
                              kpiItemName={doc.title}
                              readOnly={true}
                            />
                          </div>
                        )}
                      </div>

                      {/* Right: Scores */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Điểm số tự đánh giá</span>
                        {doc.selfScore ? (
                          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500">Nhân viên chấm:</span>
                            <span className="text-base font-extrabold text-amber-700">{doc.selfScore} / 100</span>
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-400 italic py-2">Nhân viên chưa chấm điểm tự đánh giá.</p>
                        )}
                      </div>
                    </div>

                    {/* AI Recommendation Box */}
                    <div className="p-4 bg-slate-50 border-t border-slate-100">
                      <div className="flex gap-2">
                        <Bot className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-extrabold text-indigo-700 uppercase tracking-wider block">Gợi ý phân tích tự động từ AI Assistant</span>
                          <p className="text-[11px] text-slate-600 mt-1 leading-relaxed italic">{getAiRecommendation(doc)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Evaluation input and save button */}
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
                              className="w-16 p-1.5 border border-slate-200 rounded-lg text-xs font-extrabold text-slate-800 text-center focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-xs font-bold text-slate-500 uppercase whitespace-nowrap">Điểm số thống nhất:</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              disabled={isEvaluated}
                              value={evalScores[doc.id]?.finalScore ?? doc.finalScore ?? 80}
                              onChange={e => handleScoreChange(doc.id, 'finalScore', Number(e.target.value))}
                              className="w-16 p-1.5 border border-slate-200 rounded-lg text-xs font-extrabold text-indigo-700 text-center focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50"
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
                  Chưa phân bổ KPIs cho nhân viên này trong chu kỳ hiện tại. Vui lòng bấm áp dụng định mức chức vụ.
                </div>
              )}
            </div>
          </main>
        </div>
      )}

      {/* ── PERSONAL EMPLOYEE VIEW MODE ── */}
      {(managerViewMode === 'PERSONAL_VIEW' || currentUserRole === 'EMPLOYEE') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* My active target lists */}
          <main className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <Target className="w-4.5 h-4.5 text-indigo-600" />
                  Mục tiêu KPIs cá nhân của tôi
                </h3>
                <span className="text-xs bg-indigo-50 text-indigo-600 font-extrabold px-2.5 py-0.5 rounded-full">
                  CHỦ THỂ: {selectedSub.name}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {myDocs.map(doc => {
                  let progress = 0;
                  if (doc.targetValue > 0) {
                    if (doc.unit === 'ms' || doc.unit === 'Bug') {
                      // Lower is better. Progress is 100% if currentValue <= targetValue
                      progress = doc.currentValue <= doc.targetValue ? 100 : Math.round((doc.targetValue / doc.currentValue) * 100);
                    } else {
                      progress = Math.round((doc.currentValue / doc.targetValue) * 100);
                    }
                  }
                  const clampedProgress = Math.min(100, Math.max(0, progress));

                  return (
                    <div key={doc.id} className="p-4 bg-slate-50/50 hover:bg-slate-50 rounded-xl border border-slate-200/70 transition-all space-y-3">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 leading-normal">{doc.title}</h4>
                          <span className="text-[10px] text-slate-400 font-medium">Trọng số: {doc.weight ? (doc.weight <= 1 ? Math.round(doc.weight * 100) : doc.weight) : 0}%</span>
                        </div>
                        <span className={`px-2 py-0.5 text-[8px] font-extrabold uppercase rounded ${
                          doc.status === 'EVALUATED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          doc.status === 'SELF_EVALUATED' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        }`}>
                          {doc.status}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-500">Tiến trình: {doc.currentValue.toLocaleString()} / {doc.targetValue.toLocaleString()} {doc.unit}</span>
                          <span className="text-indigo-600">{clampedProgress}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden shadow-inner">
                          <div
                            className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${clampedProgress}%` }}
                          />
                        </div>
                      </div>

                      {/* Evaluation stats if graded */}
                      {(doc.selfScore || doc.managerScore || doc.finalScore) && (
                        <div className="pt-2 grid grid-cols-3 gap-2 text-[10px] font-bold border-t border-slate-200/50 text-slate-500">
                          <div>
                            TỰ CHẤM: <span className="text-amber-700">{doc.selfScore ?? '—'}</span>
                          </div>
                          <div>
                            MGR CHẤM: <span className="text-slate-700">{doc.managerScore ?? '—'}</span>
                          </div>
                          <div>
                            THỐNG NHẤT: <span className="text-indigo-700">{doc.finalScore ?? '—'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {myDocs.length === 0 && (
                  <div className="text-center py-8 text-slate-400 italic">
                    Bạn chưa có chỉ tiêu KPI nào trong chu kỳ này.
                  </div>
                )}
              </div>
            </div>

            {/* Self-Evaluation Terminal (Only visible during EVALUATING phase) */}
            {activeCycle.status === 'EVALUATING' && myDocs.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                    <FileCheck className="w-4.5 h-4.5 text-amber-500 animate-pulse" />
                    Cổng tự đánh giá hiệu suất cá nhân (Self-Evaluation Terminal)
                  </h3>
                </div>

                <div className="divide-y divide-slate-100">
                  {myDocs.map(doc => {
                    const isSubmitted = doc.status === 'SELF_EVALUATED' || doc.status === 'EVALUATED';

                    return (
                      <div key={doc.id} className="py-4 first:pt-0 last:pb-0 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-xs text-slate-700">{doc.title}</span>
                          {isSubmitted && (
                            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" /> Đã gửi tự chấm
                            </span>
                          )}
                        </div>

                        {!isSubmitted ? (
                          <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex items-center gap-2">
                              <label className="text-xs font-bold text-slate-500 uppercase">Tự chấm (1-100):</label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={selfScores[doc.id] ?? 90}
                                onChange={e => setSelfScores(prev => ({ ...prev, [doc.id]: Number(e.target.value) }))}
                                className="w-16 p-1.5 border border-slate-200 rounded-lg text-xs font-extrabold text-slate-800 text-center focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50"
                              />
                            </div>
                            <input
                              type="text"
                              placeholder="Nhập giải thích ngắn cho số điểm này..."
                              value={selfComments[doc.id] || ''}
                              onChange={e => setSelfComments(prev => ({ ...prev, [doc.id]: e.target.value }))}
                              className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50"
                            />
                            <button
                              onClick={() => handleSelfEvalSubmit(doc.id)}
                              className="inline-flex items-center justify-center gap-1 px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-all shadow-sm shadow-amber-500/10 active:scale-[0.98]"
                            >
                              <Send className="w-3 h-3" /> Gửi tự chấm
                            </button>
                          </div>
                        ) : (
                          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs text-slate-500 flex justify-between">
                            <span>Điểm tự chấm: <strong className="text-slate-700">{doc.selfScore} / 100</strong></span>
                            <span>Minh chứng: <em>{doc.proofText || 'Không có giải trình'}</em></span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </main>

          {/* Progress Logging form and Attachment container */}
          <aside className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 pb-3 border-b border-slate-100">
              <FileText className="w-4.5 h-4.5 text-indigo-600" />
              Ghi nhật ký tiến trình (Log Progress)
            </h3>

            {myDocs.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Chưa có chỉ tiêu để báo cáo tiến trình.</p>
            ) : (
              <form onSubmit={handleLogProgressSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Chọn chỉ tiêu cập nhật</label>
                  <select
                    value={selectedMyDocId}
                    onChange={e => setSelectedMyDocId(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-semibold text-slate-600 bg-slate-50/50"
                  >
                    {myDocs.map(doc => (
                      <option key={doc.id} value={doc.id}>{doc.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Giá trị lũy tiến tăng thêm (Delta)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={valueDelta}
                      onChange={e => setValueDelta(Number(e.target.value))}
                      className="w-24 p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-bold text-slate-800 text-center bg-slate-50/50"
                    />
                    <span className="text-xs font-semibold text-slate-400">
                      đơn vị: {myDocs.find(d => d.id === selectedMyDocId)?.unit}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Giải trình & chứng cứ chi tiết</label>
                  <textarea
                    rows={3}
                    required
                    value={justification}
                    onChange={e => setJustification(e.target.value)}
                    placeholder="Nhập diễn giải hoạt động tăng chỉ số..."
                    className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs text-slate-700 bg-slate-50/50"
                  />
                </div>

                {/* Real file attachment uploader for selected KPI item */}
                <div className="border-t border-slate-100 pt-4">
                  <KpiAttachmentUploader
                    kpiItemId={selectedMyDocId}
                    kpiItemName={myDocs.find(d => d.id === selectedMyDocId)?.title}
                    onUploadSuccess={() => {
                      /* Optionally refresh the doc list */
                    }}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all active:scale-[0.98] shadow-md shadow-slate-900/10"
                >
                  Ghi nhận tiến trình hoạt động
                </button>
              </form>
            )}
          </aside>
        </div>
      )}
    </div>
  );
};
