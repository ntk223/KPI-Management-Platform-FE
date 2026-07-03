import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../features/auth';
import { useToast } from '../context';
import {
  kpiDocumentService,
  KpiAttachmentUploader,
  KpiProgressHistory,
  CreateKpiDocumentModal
} from '../features/kpi-document';
import { kpiEvaluationService } from '../features/kpi-document/services/kpiEvaluationService';
import { CustomSelect } from '../components/ui';
import { catalogService } from '../features/admin-catalog/services/catalogService';
import {
  Target,
  Plus,
  Pencil,
  Send,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  Award,
  FolderOpen,
  Paperclip,
  ChevronDown,
  ChevronUp,
  Clock,
} from 'lucide-react';

const EVALUATION_RANKS = [
  { value: 'UNSATISFACTORY', label: 'Kém' },
  { value: 'NEEDS_IMPROVEMENT', label: 'Cần cố gắng' },
  { value: 'MEETS_EXPECTATIONS', label: 'Hoàn thành' },
  { value: 'EXCEEDS_EXPECTATIONS', label: 'Hoàn thành tốt' },
  { value: 'OUTSTANDING', label: 'Xuất sắc' }
];

const getRankLabel = (rank: string) => {
  const found = EVALUATION_RANKS.find(r => r.value === rank);
  return found ? found.label : rank;
};

export const KpisPersonalPage: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [cycles, setCycles] = useState<any[]>([]);
  const [selectedCycleId, setSelectedCycleId] = useState<number | ''>('');
  
  // Data states
  const [myDoc, setMyDoc] = useState<any | null>(null);
  const [deptDocId, setDeptDocId] = useState<number | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [evaluationData, setEvaluationData] = useState<any | null>(null);

  // Modal controller states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalEditingDocId, setModalEditingDocId] = useState<number | undefined>(undefined);

  // Attachment panel toggle per KPI item
  const [expandedItemIds, setExpandedItemIds] = useState<Record<number, boolean>>({});
  const toggleItem = (itemId: number) =>
    setExpandedItemIds(prev => ({ ...prev, [itemId]: !prev[itemId] }));

  // History panel toggle per KPI item
  const [expandedHistoryIds, setExpandedHistoryIds] = useState<Record<number, boolean>>({});
  const toggleHistory = (itemId: number) =>
    setExpandedHistoryIds(prev => ({ ...prev, [itemId]: !prev[itemId] }));



  // 1. Fetch Cycles on mount
  useEffect(() => {
    catalogService.fetchAllForDropdown<any>('/kpi-cycles')
      .then(res => {
        setCycles(res);
        if (res.length > 0) {
          const activeCycle = res.find((c: any) => c.status === 'ACTIVE') || res[0];
          setSelectedCycleId(activeCycle.id);
        }
      })
      .catch(err => console.error('Error fetching cycles:', err));
  }, []);

  // 2. Load personal document & parent department document
  const loadData = async () => {
    if (!selectedCycleId || !user?.employeeId) return;
    setIsLoading(true);
    try {
      // Fetch personal document
      const personalRes = await kpiDocumentService.search({
        cycleId: Number(selectedCycleId),
        targetType: 'EMPLOYEE',
        targetId: user.employeeId
      });
      if (personalRes.success && personalRes.data && personalRes.data.length > 0) {
        const doc = personalRes.data[0];
        setMyDoc(doc);
        
        // Fetch evaluation details for personal document
        try {
          const evalRes = await kpiEvaluationService.getEvaluationDetail(doc.id);
          if (evalRes.success && evalRes.data && evalRes.data.evaluation) {
            setEvaluationData(evalRes.data.evaluation);
          } else {
            setEvaluationData(null);
          }
        } catch (e) {
          console.error('Error fetching employee evaluation:', e);
          setEvaluationData(null);
        }
      } else {
        setMyDoc(null);
        setEvaluationData(null);
      }

      // Fetch parent department KPI document
      if (user?.department?.id) {
        const deptRes = await kpiDocumentService.search({
          cycleId: Number(selectedCycleId),
          targetType: 'DEPARTMENT',
          targetId: user.department.id
        });
        if (deptRes.success && deptRes.data && deptRes.data.length > 0) {
          setDeptDocId(deptRes.data[0].id);
        } else {
          setDeptDocId(undefined);
        }
      }
    } catch (err) {
      console.error('Error loading personal KPI data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCycleId, user?.employeeId, user?.department?.id]);



  // Submit self document for approval
  const handleSubmitDoc = async (docId: number) => {
    try {
      const res = await kpiDocumentService.submit(docId);
      if (res.success) {
        toast.success('Gửi duyệt phiếu KPI thành công!');
        loadData();
      } else {
        toast.error('Gửi duyệt thất bại: ' + res.message);
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Có lỗi xảy ra khi gửi duyệt: ' + (err?.response?.data?.message || err.message || 'Lỗi không xác định'));
    }
  };

  // Status mapping
  const getStatusTextVi = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'Bản nháp';
      case 'PENDING_APPROVAL': return 'Chờ phê duyệt';
      case 'APPROVED': return 'Đã phê duyệt';
      case 'REJECTED': return 'Từ chối';
      case 'IN_PROGRESS': return 'Đang thực hiện';
      case 'CLOSED': return 'Đã đóng';
      default: return status;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-slate-50 text-slate-650 border-slate-200';
      case 'PENDING_APPROVAL': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'APPROVED': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'REJECTED': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'IN_PROGRESS': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'CLOSED': return 'bg-slate-100 text-slate-500 border-slate-300';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const renderFormattedComment = (text: string) => {
    if (!text) return null;
    const lines = text.split('\n');
    return (
      <div className="space-y-3 mt-3 text-slate-700 dark:text-zinc-300 leading-relaxed text-xs">
        {lines.map((line, idx) => {
          let trimmed = line.trim();
          if (!trimmed) return <div key={idx} className="h-1.5" />;
          
          const isBullet = trimmed.startsWith('-') || trimmed.startsWith('*');
          if (isBullet) {
            trimmed = trimmed.substring(1).trim();
          }
          
          const parseBold = (content: string) => {
            const parts = content.split('**');
            return parts.map((part, i) => {
              if (i % 2 === 1) {
                return <strong key={i} className="font-extrabold text-indigo-700 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30 px-1 rounded">{part}</strong>;
              }
              return part;
            });
          };

          if (isBullet) {
            return (
              <div key={idx} className="flex items-start gap-2.5 pl-4 py-0.5">
                <span className="text-indigo-500 mt-1 flex-shrink-0">•</span>
                <span className="flex-1">{parseBold(trimmed)}</span>
              </div>
            );
          }
          
          const isHeader = /^\d+\.\s/.test(trimmed);
          if (isHeader) {
            return (
              <h5 key={idx} className="font-extrabold text-slate-900 dark:text-zinc-50 text-sm mt-4 mb-2 flex items-center gap-2 border-b border-indigo-50 dark:border-indigo-950 pb-1">
                {parseBold(trimmed)}
              </h5>
            );
          }
          
          return (
            <p key={idx}>
              {parseBold(trimmed)}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Title Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-zinc-150 flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-650" />
            Mục tiêu & KPI cá nhân
          </h2>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            Theo dõi chỉ tiêu được giao, cập nhật tiến độ thực hiện và tự chấm điểm đánh giá
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-lg border border-slate-250 dark:bg-zinc-800 dark:border-zinc-700">
          <span className="text-[10px] font-bold text-slate-500 uppercase px-1 dark:text-zinc-400">Chu kỳ:</span>
          <CustomSelect
            value={selectedCycleId}
            onChange={val => setSelectedCycleId(val ? Number(val) : '')}
            options={cycles.map(c => ({ value: c.id, label: c.name }))}
            className="w-48"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-650"></div>
        </div>
      ) : myDoc ? (
        /* Document Found Dashboard Layout */
        <div className="space-y-6">
          {/* KẾT QUẢ ĐÁNH GIÁ CUỐI KỲ */}
          {evaluationData && (
            <div className="bg-gradient-to-br from-emerald-50/70 via-teal-50/50 to-white dark:from-emerald-950/20 dark:via-zinc-900 dark:to-zinc-900 p-6 rounded-2xl border border-emerald-250/30 dark:border-emerald-900/40 shadow-sm flex flex-col md:flex-row md:items-start justify-between gap-6 animate-[fadeIn_0.15s_ease-out]">
              <div className="flex items-start gap-4 flex-1">
                <div className="p-3 bg-gradient-to-br from-emerald-600 to-teal-600 text-white rounded-xl shadow-md flex-shrink-0 mt-0.5 animate-pulse">
                  <Award className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-slate-900 dark:text-zinc-50 text-sm uppercase tracking-wider">
                    Kết quả Đánh giá KPI Cuối kỳ từ Quản lý
                  </h4>
                  {renderFormattedComment(evaluationData.managerComment)}
                </div>
              </div>
              <div className="flex-shrink-0 bg-white dark:bg-zinc-900/80 px-6 py-4 rounded-2xl border border-emerald-100 dark:border-emerald-950 text-center shadow-sm min-w-[150px]">
                <span className="text-[10px] font-bold text-slate-450 dark:text-zinc-500 uppercase tracking-wider block mb-1">Xếp loại của bạn</span>
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 block mt-1">
                  {getRankLabel(evaluationData.evaluationRank)}
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-[fadeIn_0.15s_ease-out]">
          
          {/* Main KPI Details List */}
          <main className="lg:col-span-8 space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4 dark:bg-zinc-900 dark:border-zinc-800">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-zinc-850">
                <div className="space-y-0.5">
                  <h3 className="font-bold text-slate-850 dark:text-zinc-200 text-sm flex items-center gap-1.5">
                    <Award className="w-4.5 h-4.5 text-indigo-650" />
                    Chỉ tiêu KPI chu kỳ hiện tại
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold">
                    Mã phiếu: {myDoc.documentCode} | Tạo bởi: {myDoc.createdBy || 'Hệ thống'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {showSubmitConfirm ? (
                    <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/40 p-1.5 rounded-lg border border-indigo-200 dark:border-indigo-900 animate-[fadeIn_0.15s_ease-out]">
                      <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-350">Gửi duyệt phiếu?</span>
                      <button
                        onClick={() => setShowSubmitConfirm(false)}
                        className="px-2 py-1 bg-white border border-slate-200 text-slate-600 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 hover:bg-slate-50 text-[10px] font-bold rounded cursor-pointer"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={() => {
                          setShowSubmitConfirm(false);
                          handleSubmitDoc(myDoc.id);
                        }}
                        className="px-2.5 py-1 bg-indigo-650 text-white hover:bg-indigo-700 text-[10px] font-bold rounded cursor-pointer"
                      >
                        Xác nhận
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg border ${getStatusBadgeClass(myDoc.status)}`}>
                        {getStatusTextVi(myDoc.status)}
                      </span>
                      <button
                        onClick={() => {
                          setModalEditingDocId(myDoc.id);
                          setIsModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition-all shadow-sm dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5 text-slate-500" /> Chỉnh sửa
                      </button>
                      {myDoc.status === 'DRAFT' && (
                        <button
                          onClick={() => setShowSubmitConfirm(true)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" /> Gửi duyệt
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Items list */}
              <div className="space-y-4">
                {myDoc.kpiItems && myDoc.kpiItems.length > 0 ? (
                  myDoc.kpiItems.map((item: any, idx: number) => {
                    const progress = item.progress !== undefined && item.progress !== null
                      ? Math.min(100, Math.round(item.progress))
                      : (item.targetValue > 0
                        ? Math.min(100, Math.round(((item.currentValue || 0) / item.targetValue) * 100))
                        : 0);

                    return (
                      <div key={item.id || idx} className="p-4 bg-slate-50/50 dark:bg-zinc-850/50 hover:bg-slate-50 dark:hover:bg-zinc-800 border border-slate-200/70 dark:border-zinc-800 rounded-xl transition-all space-y-3">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200">{item.name}</h4>
                              <span className={`px-1.5 py-0.2 text-[8px] font-extrabold uppercase rounded-lg border ${
                                item.hasChildren ? 'bg-amber-50 text-amber-705 border-amber-250' :
                                item.itemType === 'NUMERIC' ? 'bg-sky-50 text-sky-700 border-sky-200' :
                                'bg-indigo-50 text-indigo-700 border-indigo-200'
                              }`}>
                                {item.hasChildren ? "Nhóm" : (item.itemType === 'NUMERIC' ? 'Số lượng' : 'Tỷ lệ %')}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold mt-0.5">{item.description || 'Không có mô tả'}</p>
                          </div>
                          <span className="text-[10px] text-indigo-750 dark:text-indigo-400 font-bold bg-indigo-50/50 dark:bg-indigo-950/20 px-2 py-0.5 rounded-lg border border-indigo-100 dark:border-indigo-900/40 whitespace-nowrap">
                            Trọng số: {item.weight ? (item.weight <= 1 ? Math.round(item.weight * 100) : item.weight) : 0}%
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[11px] font-bold">
                            <span className="text-slate-500 dark:text-zinc-400">
                              {item.hasChildren ? (
                                <span>Tiến độ nhóm (tự động tính từ các mục tiêu con)</span>
                              ) : (
                                <span>
                                  Tiến độ thực tế: <span className="text-slate-800 dark:text-zinc-200">{item.currentValue || 0}</span> / {item.targetValue} {item.unit}
                                </span>
                              )}
                            </span>
                            <span className="text-indigo-650 dark:text-indigo-400">{progress}%</span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-zinc-800 rounded-full h-2 overflow-hidden shadow-inner">
                            <div 
                              className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all duration-350"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>

                        {/* Attachment & History toggle — only show if item has an ID */}
                        {item.id && (
                          <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 space-y-3">
                            <div className="flex items-center gap-4">
                              <button
                                type="button"
                                onClick={() => toggleItem(item.id)}
                                className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-605 hover:text-indigo-805 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                              >
                                <Paperclip className="w-3.5 h-3.5" />
                                Minh chứng đính kèm
                                {expandedItemIds[item.id]
                                  ? <ChevronUp className="w-3 h-3" />
                                  : <ChevronDown className="w-3 h-3" />
                                }
                              </button>

                              <button
                                type="button"
                                onClick={() => toggleHistory(item.id)}
                                className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-300 transition-colors"
                              >
                                <Clock className="w-3.5 h-3.5" />
                                Nhật ký tiến độ
                                {expandedHistoryIds[item.id]
                                  ? <ChevronUp className="w-3 h-3" />
                                  : <ChevronDown className="w-3 h-3" />
                                }
                              </button>
                            </div>

                            {expandedItemIds[item.id] && (
                              <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-750">
                                <KpiAttachmentUploader
                                  kpiItemId={item.id}
                                  kpiItemName={item.name}
                                />
                              </div>
                            )}

                            {expandedHistoryIds[item.id] && (
                              <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-750">
                                <KpiProgressHistory
                                  kpiItemId={item.id}
                                  unit={item.unit}
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-slate-400 italic">
                    Phiếu KPI này không có tiêu chí nào.
                  </div>
                )}
              </div>
            </div>
          </main>

          {/* Right Column - Workflow Info & Progress Update Form */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Status Information Box */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4 dark:bg-zinc-900 dark:border-zinc-800">
              <h3 className="font-bold text-slate-800 dark:text-zinc-200 text-xs uppercase tracking-wider text-slate-400 dark:text-zinc-550 border-b border-slate-100 dark:border-zinc-850 pb-2">
                Thông tin phê duyệt
              </h3>

              {myDoc.status === 'APPROVED' ? (
                <div className="p-4 bg-emerald-50 border border-emerald-150 rounded-xl space-y-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-650" />
                  <h4 className="font-bold text-xs text-emerald-800">KPI Đã được duyệt</h4>
                  <p className="text-[11px] text-emerald-600 leading-relaxed font-medium">
                    Phiếu KPI đã được Trưởng phòng phê duyệt chính thức. Bạn hãy bám sát mục tiêu để hoàn thành xuất sắc nhiệm vụ.
                  </p>
                </div>
              ) : myDoc.status === 'PENDING_APPROVAL' ? (
                <div className="p-4 bg-amber-50 border border-amber-150 rounded-xl space-y-2">
                  <Calendar className="w-5 h-5 text-amber-600" />
                  <h4 className="font-bold text-xs text-amber-800">Đang chờ phê duyệt</h4>
                  <p className="text-[11px] text-amber-600 leading-relaxed font-medium">
                    Phiếu KPI đang nằm trong danh sách chờ phê duyệt của Trưởng phòng. Bạn sẽ nhận được thông báo khi được duyệt.
                  </p>
                </div>
              ) : myDoc.status === 'REJECTED' ? (
                <div className="p-4 bg-rose-50 border border-rose-150 rounded-xl space-y-2">
                  <XCircle className="w-5 h-5 text-rose-650" />
                  <h4 className="font-bold text-xs text-rose-800">Bị từ chối phê duyệt</h4>
                  <p className="text-[11px] text-rose-600 leading-relaxed font-medium">
                    Lý do từ chối: <span className="font-bold italic">"{myDoc.rejectReason || 'Không có lý do chi tiết'}"</span>
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setModalEditingDocId(myDoc.id);
                        setIsModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Chỉnh sửa & Gửi lại
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <AlertCircle className="w-5 h-5 text-slate-500" />
                  <h4 className="font-bold text-xs text-slate-800">Trạng thái: Bản nháp</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                    Mục tiêu KPI cá nhân chưa được gửi duyệt. Vui lòng kiểm tra lại danh sách các tiêu chí và click "Gửi duyệt" phía trên.
                  </p>
                </div>
              )}
            </div>

            {/* Update Progress Link */}
            {myDoc.kpiItems && myDoc.kpiItems.length > 0 && user?.employeeId && myDoc.status === 'APPROVED' && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3 dark:bg-zinc-900 dark:border-zinc-800">
                <h3 className="font-bold text-slate-800 dark:text-zinc-200 text-xs uppercase tracking-wider text-slate-400 dark:text-zinc-550 border-b border-slate-100 dark:border-zinc-850 pb-2 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Cập nhật tiến độ
                </h3>
                <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                  Để báo cáo số liệu thực tế, cập nhật tiến trình và tải tài liệu minh chứng cho các chỉ tiêu, bạn hãy thực hiện ở trang Nhật ký tiến độ.
                </p>
                <Link
                  to="/tracking-logs"
                  className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-650 hover:bg-indigo-750 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  Đi đến Nhật ký tiến độ
                </Link>
              </div>
            )}
          </aside>
        </div>
      </div>
    ) : (
        /* Empty State - Propose New KPI Doc */
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center space-y-4 max-w-2xl mx-auto animate-[fadeIn_0.15s_ease-out] dark:bg-zinc-900 dark:border-zinc-800">
          <div className="w-14 h-14 rounded-full bg-indigo-50 dark:bg-zinc-850 flex items-center justify-center mx-auto shadow-inner">
            <FolderOpen className="w-7 h-7 text-indigo-550 dark:text-indigo-400" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-bold text-slate-800 dark:text-zinc-200 text-base">Chưa có KPI cá nhân</h3>
            <p className="text-xs text-slate-400 font-semibold max-w-md mx-auto">
              Bạn chưa được giao hoặc tự đề xuất phiếu KPI cá nhân cho chu kỳ hiện tại. Hãy tạo phiếu đề xuất mới ngay để gửi Trưởng phòng phê duyệt.
            </p>
          </div>
          <button
            onClick={() => {
              setModalEditingDocId(undefined);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" /> Đề xuất phiếu KPI mới
          </button>
        </div>
      )}

      {/* --- CREATE & EDIT MODAL --- */}
      {isModalOpen && selectedCycleId && user?.employeeId && (
        <CreateKpiDocumentModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setModalEditingDocId(undefined);
          }}
          selectedCycleId={Number(selectedCycleId)}
          editingDocId={modalEditingDocId}
          presetTargetType="EMPLOYEE"
          presetTargetId={user.employeeId}
          presetParentDocId={deptDocId}
          onSuccess={loadData}
        />
      )}
    </div>
  );
};

export default KpisPersonalPage;
