import React, { useState, useEffect } from 'react';
import { useAuth } from '../features/auth';
import { catalogService } from '../features/admin-catalog/services/catalogService';
import { kpiDocumentService } from '../features/kpi-document';
import { kpiEvaluationService, KpiDocumentEvaluationDetailDTO } from '../features/kpi-document/services/kpiEvaluationService';
import { useToast } from '../context';
import { CustomSelect } from '../components/ui';
import {
  Sparkles,
  ClipboardCheck,
  Building,
  User,
  AlertCircle,
  CheckCircle,
  FileText,
  Save,
  Loader2,
} from 'lucide-react';
import { CycleItem, DepartmentItem } from '../features/admin-catalog/types';

export const EVALUATION_RANKS = [
  { value: 'UNSATISFACTORY', label: 'Kém' },
  { value: 'NEEDS_IMPROVEMENT', label: 'Cần cố gắng' },
  { value: 'MEETS_EXPECTATIONS', label: 'Hoàn thành' },
  { value: 'EXCEEDS_EXPECTATIONS', label: 'Hoàn thành tốt' },
  { value: 'OUTSTANDING', label: 'Xuất sắc' }
];

export const getRankLabel = (rank: string) => {
  const found = EVALUATION_RANKS.find(r => r.value === rank);
  return found ? found.label : rank;
};

export const DirectorReviewPage: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();

  // Filters state
  const [cycles, setCycles] = useState<CycleItem[]>([]);
  const [selectedCycleId, setSelectedCycleId] = useState<number | ''>('');
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<number | ''>('');
  const [activeTab, setActiveTab] = useState<'UNRESOLVED' | 'RESOLVED'>('UNRESOLVED');

  // Director evaluation for manager's department
  const [directorDeptEval, setDirectorDeptEval] = useState<any | null>(null);

  // Data loading states
  const [loadingFilters, setLoadingFilters] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [loadingAi, setLoadingAi] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // List of pending documents & members
  const [allDocs, setAllDocs] = useState<any[]>([]);
  const [deptEmployees, setDeptEmployees] = useState<any[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);

  // Active document & evaluation details
  const [detailData, setDetailData] = useState<KpiDocumentEvaluationDetailDTO | null>(null);

  // Form inputs
  const [managerComment, setManagerComment] = useState('');
  const [evaluationRank, setEvaluationRank] = useState<string>('MEETS_EXPECTATIONS');

  // Confirmation Modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // 1. Fetch Cycles & Departments on Mount
  useEffect(() => {
    const initFilters = async () => {
      setLoadingFilters(true);
      try {
        const [cyclesRes, deptsRes] = await Promise.all([
          catalogService.fetchAllForDropdown<CycleItem>('/kpi-cycles'),
          catalogService.fetchAllForDropdown<DepartmentItem>('/departments')
        ]);
        
        // Only select cycles in EVALUATING status
        const evaluatingCycles = cyclesRes.filter(c => c.status === 'EVALUATING');
        setCycles(evaluatingCycles);
        setDepartments(deptsRes);

        // Auto-select first evaluating cycle
        if (evaluatingCycles.length > 0) {
          setSelectedCycleId(evaluatingCycles[0].id);
        }

        // Auto-select user's department if available
        if (deptsRes.length > 0) {
          const userDept = deptsRes.find(d => d.id === user?.department?.id) || deptsRes[0];
          setSelectedDeptId(userDept.id);
        }
      } catch (err) {
        console.error('Error fetching filters:', err);
        toast.error('Lỗi khi tải bộ lọc phòng ban/chu kỳ');
      } finally {
        setLoadingFilters(false);
      }
    };

    initFilters();
  }, [user]);

  // 2. Fetch Department Members when selectedDeptId changes
  useEffect(() => {
    if (!selectedDeptId) {
      setDeptEmployees([]);
      return;
    }

    catalogService.getDepartmentMembers(Number(selectedDeptId))
      .then(res => {
        if (res.success && res.data) {
          setDeptEmployees(res.data.employees || []);
        } else {
          setDeptEmployees([]);
        }
      })
      .catch(err => {
        console.error('Error fetching department members:', err);
        setDeptEmployees([]);
      });
  }, [selectedDeptId]);

  // 3. Fetch Pending Documents when cycle or department changes
  useEffect(() => {
    const fetchDocs = async () => {
      if (!selectedCycleId || !selectedDeptId) {
        setAllDocs([]);
        return;
      }
      setLoadingDocs(true);
      try {
        const res = await kpiDocumentService.search({
          cycleId: selectedCycleId,
          status: 'EVALUATING'
        });

        if (res.success && res.data) {
          const employeeIds = deptEmployees.map(e => e.id);
          // Filter documents: 
          // - Department level matches selected department ID (Director only evaluates departments)
          // - Employee level matches employee IDs in this department (Manager only evaluates employees)
          const filtered = res.data.filter((doc: any) => {
            if (user?.role === 'DIRECTOR') {
              return doc.targetType === 'DEPARTMENT' && doc.targetId === Number(selectedDeptId);
            }
            if (user?.role === 'MANAGER') {
              return doc.targetType === 'EMPLOYEE' && employeeIds.includes(doc.targetId);
            }
            return false;
          });
          setAllDocs(filtered);
        } else {
          setAllDocs([]);
        }
      } catch (err) {
        console.error('Error loading documents:', err);
        toast.error('Lỗi khi tải danh sách phiếu KPI');
      } finally {
        setLoadingDocs(false);
      }
    };

    fetchDocs();
  }, [selectedCycleId, selectedDeptId, deptEmployees, user]);

  // 4. Fetch Details when selectedDocId changes
  useEffect(() => {
    if (!selectedDocId) {
      setDetailData(null);
      setManagerComment('');
      setEvaluationRank('MEETS_EXPECTATIONS');
      return;
    }

    const loadDetails = async () => {
      setLoadingDetails(true);
      try {
        const res = await kpiEvaluationService.getEvaluationDetail(selectedDocId);
        if (res.success && res.data) {
          setDetailData(res.data);
          
          // Populate form with existing draft evaluation if present
          if (res.data.evaluation) {
            setManagerComment(res.data.evaluation.managerComment || '');
            setEvaluationRank(res.data.evaluation.evaluationRank || 'MEETS_EXPECTATIONS');
          } else {
            setManagerComment('');
            setEvaluationRank('MEETS_EXPECTATIONS');
          }
        }
      } catch (err) {
        console.error('Error loading details:', err);
        toast.error('Lỗi khi tải chi tiết phiếu đánh giá');
        setSelectedDocId(null);
      } finally {
        setLoadingDetails(false);
      }
    };

    loadDetails();
  }, [selectedDocId]);

  // 4.5. Fetch Director's Department Evaluation (Manager only)
  useEffect(() => {
    if (user?.role !== 'MANAGER' || !selectedCycleId || !user?.department?.id) {
      setDirectorDeptEval(null);
      return;
    }

    const fetchDirectorEval = async () => {
      try {
        const res = await kpiDocumentService.search({
          cycleId: selectedCycleId,
          targetType: 'DEPARTMENT',
          targetId: user.department?.id
        });

        if (res.success && res.data && res.data.length > 0) {
          const deptDoc = res.data[0];
          const evalRes = await kpiEvaluationService.getEvaluationDetail(deptDoc.id);
          if (evalRes.success && evalRes.data && evalRes.data.evaluation) {
            setDirectorDeptEval(evalRes.data.evaluation);
          } else {
            setDirectorDeptEval(null);
          }
        } else {
          setDirectorDeptEval(null);
        }
      } catch (err) {
        console.error('Error fetching Director department evaluation:', err);
        setDirectorDeptEval(null);
      }
    };

    fetchDirectorEval();
  }, [user, selectedCycleId]);

  // 5. Trigger AI Suggestion
  const handleAiSuggestion = async () => {
    if (!selectedDocId) return;
    setLoadingAi(true);
    try {
      const res = await kpiEvaluationService.getAiSuggestion(selectedDocId);
      if (res.success && res.data) {
        setManagerComment(res.data);
        toast.success('Đã tải nhận xét gợi ý từ AI thành công!');
      } else {
        toast.error('Không nhận được phản hồi từ AI');
      }
    } catch (err) {
      console.error('AI suggestion error:', err);
      toast.error('Lỗi kết nối AI Assistant');
    } finally {
      setLoadingAi(false);
    }
  };

  // 6. Handle Save Submit
  const handleSave = async () => {
    if (!selectedDocId) return;
    if (!managerComment.trim()) {
      toast.error('Vui lòng nhập nhận xét đánh giá');
      return;
    }
    if (!evaluationRank) {
      toast.error('Vui lòng chọn xếp loại đánh giá');
      return;
    }

    setSubmitting(true);
    try {
      const res = await kpiEvaluationService.saveEvaluation(selectedDocId, {
        managerComment: managerComment.trim(),
        evaluationRank: evaluationRank
      });

      if (res.success) {
        toast.success('Hoàn tất đánh giá KPI thành công!');
        setShowConfirmModal(false);
        // Reload list and reset selections
        setSelectedDocId(null);
        // Force refresh document list by updating isEvaluated field
        setAllDocs(prev => prev.map(doc => doc.id === selectedDocId ? { ...doc, isEvaluated: true } : doc));
      }
    } catch (err) {
      console.error('Save evaluation error:', err);
      toast.error('Gặp lỗi khi lưu kết quả đánh giá');
    } finally {
      setSubmitting(false);
    }
  };

  // Render Status Badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'EVALUATING':
        return <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900">Đang đánh giá</span>;
      default:
        return <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-slate-100 text-slate-600 border border-slate-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700">{status}</span>;
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

  const displayedDocs = allDocs.filter(doc => {
    if (activeTab === 'UNRESOLVED') {
      return !doc.isEvaluated;
    } else {
      return doc.isEvaluated;
    }
  });

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-150 dark:border-zinc-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-zinc-50 flex items-center gap-2">
            <ClipboardCheck className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Đánh Giá KPI Cuối Kỳ
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Giao diện dành riêng cho Giám đốc/Quản lý đánh giá hiệu suất, duyệt kết quả tổng hợp của phòng ban và nhân viên.
          </p>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-150 dark:border-zinc-800 shadow-sm flex flex-wrap gap-4 items-end">
        <div className="w-full sm:w-64">
          <CustomSelect
            label="Chu kỳ đánh giá"
            value={selectedCycleId}
            onChange={(val) => {
              setSelectedCycleId(val);
              setSelectedDocId(null);
            }}
            options={cycles.map(c => ({ value: c.id, label: c.name }))}
            disabled={loadingFilters}
          />
        </div>
        <div className="w-full sm:w-64">
          <CustomSelect
            label="Phòng ban"
            value={selectedDeptId}
            onChange={(val) => {
              setSelectedDeptId(val);
              setSelectedDocId(null);
            }}
            options={
              user?.role === 'DIRECTOR'
                ? departments.map(d => ({ value: d.id, label: d.name }))
                : [{ value: user?.department?.id || '', label: user?.department?.name || 'Phòng ban của tôi' }]
            }
            disabled={loadingFilters || user?.role === 'MANAGER'}
          />
        </div>
        {loadingFilters && (
          <div className="flex items-center text-slate-400 gap-2 mb-2 text-sm">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
            Đang đồng bộ dữ liệu...
          </div>
        )}
      </div>

      {/* DIRECTOR DEPARTMENT EVALUATION BREADCRUMB (FOR MANAGER ONLY) */}
      {user?.role === 'MANAGER' && directorDeptEval && (
        <div className="bg-gradient-to-br from-indigo-50/70 via-blue-50/50 to-white dark:from-indigo-950/20 dark:via-zinc-900 dark:to-zinc-900 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 shadow-sm flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-start gap-4 flex-1">
            <div className="p-3 bg-gradient-to-br from-indigo-600 to-blue-600 text-white rounded-xl shadow-md flex-shrink-0 mt-0.5 animate-pulse">
              <Sparkles className="w-5 h-5 text-yellow-300 fill-yellow-300" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-black text-slate-900 dark:text-zinc-50 text-sm uppercase tracking-wider flex items-center gap-2">
                Đánh giá của Ban Giám đốc đối với Phòng ban của bạn ({user?.department?.name})
              </h4>
              {renderFormattedComment(directorDeptEval.managerComment)}
            </div>
          </div>
          <div className="flex-shrink-0 bg-white dark:bg-zinc-900/80 px-6 py-4 rounded-2xl border border-indigo-100 dark:border-indigo-950 text-center shadow-sm min-w-[150px]">
            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-555 uppercase tracking-wider block mb-1">Xếp loại của Phòng</span>
            <span className="text-lg font-black text-indigo-600 dark:text-indigo-400 block mt-1">
              {getRankLabel(directorDeptEval.evaluationRank)}
            </span>
          </div>
        </div>
      )}

      {/* MAIN VIEWPORT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: PENDING DOCUMENTS LIST */}
        <div className="lg:col-span-4 bg-white dark:bg-zinc-900 rounded-xl border border-slate-150 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col max-h-[750px]">
          <div className="p-4 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-2 text-sm uppercase tracking-wider">
              <FileText className="w-4 h-4 text-indigo-500" />
              Danh Sách Phiếu KPI ({displayedDocs.length})
            </h3>
          </div>

          <div className="p-3 bg-slate-50/30 dark:bg-zinc-900/30 border-b border-slate-100 dark:border-zinc-800">
            <div className="flex p-1 bg-slate-100 dark:bg-zinc-800 rounded-lg">
              <button
                onClick={() => { setActiveTab('UNRESOLVED'); setSelectedDocId(null); }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
                  activeTab === 'UNRESOLVED'
                    ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                Chưa đánh giá ({allDocs.filter(d => !d.isEvaluated).length})
              </button>
              <button
                onClick={() => { setActiveTab('RESOLVED'); setSelectedDocId(null); }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
                  activeTab === 'RESOLVED'
                    ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                Đã đánh giá ({allDocs.filter(d => d.isEvaluated).length})
              </button>
            </div>
          </div>

          <div className="p-3 overflow-y-auto space-y-2 divide-y divide-slate-50 dark:divide-zinc-800 flex-1">
            {loadingDocs ? (
              <div className="py-12 text-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500 mb-2" />
                Đang quét phiếu KPI...
              </div>
            ) : displayedDocs.length === 0 ? (
              <div className="py-12 text-center text-slate-450 dark:text-zinc-555">
                <AlertCircle className="w-10 h-10 mx-auto text-slate-300 dark:text-zinc-700 mb-2" />
                Không có phiếu nào trong danh mục này.
              </div>
            ) : (
              displayedDocs.map((doc) => {
                const isSelected = selectedDocId === doc.id;
                return (
                  <button
                    key={doc.id}
                    onClick={() => setSelectedDocId(doc.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all duration-150 ${
                      isSelected
                        ? 'bg-indigo-50/80 border-indigo-200 dark:bg-indigo-950/20 dark:border-indigo-850 shadow-sm'
                        : 'border-transparent hover:bg-slate-50 dark:hover:bg-zinc-800/40'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 tracking-wider">
                        {doc.documentCode}
                      </span>
                      {getStatusBadge(doc.status)}
                    </div>
                    
                    <div className="flex items-center gap-2 text-slate-800 dark:text-zinc-200 font-semibold text-sm mb-1.5">
                      {doc.targetType === 'DEPARTMENT' ? (
                        <Building className="w-4 h-4 text-slate-400" />
                      ) : (
                        <User className="w-4 h-4 text-slate-400" />
                      )}
                      <span className="truncate">{doc.targetName}</span>
                    </div>

                    <div className="flex justify-between items-center text-xs text-slate-450 dark:text-zinc-500 mt-2">
                      <span>Loại: {doc.targetType === 'DEPARTMENT' ? 'Phòng ban' : 'Cá nhân'}</span>
                      <span className="font-bold text-slate-600 dark:text-zinc-400">
                        Đạt: {Math.round(doc.totalProgress ?? 0)}%
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: EVALUATION DETAIL & WORKSPACE */}
        <div className="lg:col-span-8 space-y-6">
          {!selectedDocId ? (
            <div className="bg-white dark:bg-zinc-900 border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl p-16 text-center shadow-sm">
              <Sparkles className="w-16 h-16 text-indigo-300 dark:text-zinc-700 mx-auto mb-4 animate-pulse" />
              <h3 className="text-lg font-bold text-slate-700 dark:text-zinc-300">Sẵn Sàng Đánh Giá</h3>
              <p className="text-sm text-slate-400 dark:text-zinc-500 max-w-md mx-auto mt-2">
                Hãy lựa chọn một phiếu KPI cần thẩm định từ danh sách bên trái để kiểm tra dữ liệu kết quả thực hiện và điền đánh giá tổng hợp.
              </p>
            </div>
          ) : loadingDetails ? (
            <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-xl p-20 text-center shadow-sm">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">Đang nạp dữ liệu chi tiết phiếu và kết quả thực hiện chỉ tiêu...</p>
            </div>
          ) : detailData ? (
            <>
              {/* DOCUMENT META HEADER */}
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-slate-150 dark:border-zinc-800 shadow-sm">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                      Phiếu KPI: {detailData.document.documentCode}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 flex items-center gap-3">
                      <span>Đối tượng: <strong className="text-slate-700 dark:text-zinc-200">{detailData.document.targetName}</strong></span>
                      <span>•</span>
                      <span>Chu kỳ: <strong className="text-slate-700 dark:text-zinc-200">{detailData.document.cycleName}</strong></span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Tiến độ chung</span>
                    <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                      {Math.round(detailData.document.totalProgress ?? 0)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* KPI ITEMS DETAIL TABLE */}
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-150 dark:border-zinc-800 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50">
                  <h3 className="font-bold text-slate-800 dark:text-zinc-200 text-xs uppercase tracking-wider">
                    Kết Quả Chi Tiết Mục Tiêu KPI
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/50 dark:bg-zinc-900/50 border-b border-slate-100 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 uppercase tracking-wider font-semibold">
                        <th className="p-4">Tên mục tiêu</th>
                        <th className="p-4 w-24">Trọng số</th>
                        <th className="p-4 w-32 text-right">Chỉ tiêu (Target)</th>
                        <th className="p-4 w-32 text-right">Thực tế đạt được</th>
                        <th className="p-4 w-28 text-right">Tiến độ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                      {detailData.document.kpiItems.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-400 dark:text-zinc-500">
                            Không tìm thấy dữ liệu chỉ tiêu cụ thể.
                          </td>
                        </tr>
                      ) : (
                        detailData.document.kpiItems.map((item, idx) => (
                          <tr key={item.id ?? idx} className="hover:bg-slate-50/40 dark:hover:bg-zinc-800/10">
                            <td className="p-4">
                              <div className="font-semibold text-slate-800 dark:text-zinc-250">{item.name}</div>
                              {item.description && (
                                <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5 max-w-md line-clamp-1">
                                  {item.description}
                                </p>
                              )}
                            </td>
                            <td className="p-4 text-slate-600 dark:text-zinc-400 font-medium">
                              {item.documentWeight}%
                            </td>
                            <td className="p-4 text-right font-semibold text-slate-700 dark:text-zinc-300">
                              {item.targetValue} {item.unit}
                            </td>
                            <td className="p-4 text-right font-bold text-slate-900 dark:text-zinc-100">
                              {item.currentValue ?? 0} {item.unit}
                            </td>
                            <td className="p-4 text-right font-black text-indigo-650 dark:text-indigo-400">
                              {Math.round(item.progress ?? 0)}%
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* EVALUATION PANEL */}
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-slate-150 dark:border-zinc-800 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-zinc-800 pb-3">
                  <h3 className="font-bold text-slate-800 dark:text-zinc-250 text-sm uppercase tracking-wider flex items-center gap-2">
                    <ClipboardCheck className="w-5 h-5 text-indigo-500" />
                    Thẩm Định & Nhận Xét
                  </h3>
                  
                  <button
                    type="button"
                    onClick={handleAiSuggestion}
                    disabled={loadingAi}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-55 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg text-xs font-semibold shadow-sm transition-all duration-150 disabled:opacity-50"
                  >
                    {loadingAi ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
                    )}
                    Dùng AI gợi ý nhận xét
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Nhận xét TextArea */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-zinc-400">
                      Ý kiến của Giám đốc/Quản lý cấp cao
                    </label>
                    <textarea
                      rows={8}
                      value={managerComment}
                      onChange={(e) => setManagerComment(e.target.value)}
                      placeholder="Ý kiến đánh giá tổng quan, các mặt ưu điểm/hạn chế của phòng ban hoặc cá nhân..."
                      className="w-full p-3.5 text-sm rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/30 dark:bg-zinc-900/30 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-555 focus:outline-none dark:text-zinc-100"
                    />
                  </div>

                  {/* Xếp loại Chọn */}
                  <div className="w-full sm:w-72 space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-zinc-400">
                      Xếp loại đánh giá hiệu suất
                    </label>
                    <CustomSelect
                      value={evaluationRank}
                      onChange={(val) => setEvaluationRank(val)}
                      options={EVALUATION_RANKS}
                    />
                  </div>
                </div>

                {/* Submit Actions */}
                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setShowConfirmModal(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all duration-150"
                  >
                    <Save className="w-4 h-4" />
                    Xác nhận & Lưu đánh giá
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* CONFIRMATION POPUP MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 transition-opacity" onClick={() => setShowConfirmModal(false)} />

          <div className="relative bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full shadow-2xl p-6 border border-slate-100 dark:border-zinc-800 space-y-4 transform transition-all duration-300">
            <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="w-7 h-7 flex-shrink-0" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-100">
                Xác Nhận Lưu Kết Quả
              </h3>
            </div>
            
            <div className="text-sm text-slate-550 dark:text-zinc-400 space-y-3 leading-relaxed">
              <p>
                Bạn đang chuẩn bị chốt kết quả đánh giá KPI cho tài liệu: <strong className="text-slate-800 dark:text-zinc-200">{detailData?.document.documentCode}</strong>.
              </p>
              <div className="bg-slate-50 dark:bg-zinc-800/40 p-3 rounded-lg border border-slate-100 dark:border-zinc-800 space-y-1 text-xs">
                <div>Xếp loại chốt: <strong className="text-emerald-650 dark:text-emerald-450 text-sm">{getRankLabel(evaluationRank)}</strong></div>
                <div className="line-clamp-3 text-slate-500">Ý kiến nhận xét: {managerComment}</div>
              </div>
              <p className="text-rose-500 font-medium text-xs">
                * Hành động này sẽ lưu kết quả đánh giá KPI. Vui lòng đảm bảo các thông tin trên là chính xác.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={submitting}
                className="px-4 py-2 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={submitting}
                className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all duration-150 disabled:opacity-55"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DirectorReviewPage;
