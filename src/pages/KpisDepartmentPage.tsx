import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../features/auth';
import { kpiDocumentService } from '../features/kpi-document';
import { catalogService } from '../features/admin-catalog/services/catalogService';
import { CreateKpiDocumentModal } from '../features/kpi-document';
import {
  Target,
  Network,
  ChevronDown,
  ChevronRight,
  Plus,
  Building,
  User,
  Calendar,
  Pencil,
  Send,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Users,
  FolderLock,
  Briefcase
} from 'lucide-react';

export const KpisDepartmentPage: React.FC = () => {
  const { user } = useAuth();
  const currentUserRole = user?.role || 'EMPLOYEE';

  // Core layout states
  const [cycles, setCycles] = useState<any[]>([]);
  const [selectedCycleId, setSelectedCycleId] = useState<number | ''>('');
  const [activeTab, setActiveTab] = useState<'MY_DEPT' | 'SUBORDINATES'>('MY_DEPT');
  
  // Data states
  const [deptDoc, setDeptDoc] = useState<any | null>(null);
  const [subordinateDocs, setSubordinateDocs] = useState<any[]>([]);
  const [allCycleDocs, setAllCycleDocs] = useState<any[]>([]); // For Admin/Director tree view
  
  // Modal controller states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalEditingDocId, setModalEditingDocId] = useState<number | undefined>(undefined);
  const [modalPresetTargetType, setModalPresetTargetType] = useState<'COMPANY' | 'DEPARTMENT' | 'EMPLOYEE' | undefined>(undefined);
  const [modalPresetTargetId, setModalPresetTargetId] = useState<number | undefined>(undefined);
  const [modalPresetParentDocId, setModalPresetParentDocId] = useState<number | undefined>(undefined);
  
  // Loading & Selection states
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSubDocId, setSelectedSubDocId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // Expand state for Tree Node Renderer
  const [expandedDocs, setExpandedDocs] = useState<Record<number, boolean>>({});
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});

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

  // 2. Fetch specific Manager or Admin/Director data based on selectedCycleId
  const loadData = async () => {
    if (!selectedCycleId) return;
    setIsLoading(true);
    try {
      if (currentUserRole === 'ADMIN' || currentUserRole === 'DIRECTOR') {
        // Fetch all documents for hierarchical display
        const res = await kpiDocumentService.search({ cycleId: selectedCycleId });
        if (res.success && res.data) {
          setAllCycleDocs(res.data);
        }
      } else if (currentUserRole === 'MANAGER') {
        const deptId = user?.department?.id;
        if (!deptId) {
          setIsLoading(false);
          return;
        }

        // Fetch Manager's department document
        const deptRes = await kpiDocumentService.search({
          cycleId: selectedCycleId,
          targetType: 'DEPARTMENT',
          targetId: deptId
        });

        if (deptRes.success && deptRes.data) {
          const currentDeptDoc = deptRes.data[0] || null;
          setDeptDoc(currentDeptDoc);

          if (currentDeptDoc) {
            // Fetch employee documents parented under the department document
            const subRes = await kpiDocumentService.search({
              cycleId: selectedCycleId,
              targetType: 'EMPLOYEE',
              parentDocId: currentDeptDoc.id
            });
            if (subRes.success && subRes.data) {
              setSubordinateDocs(subRes.data);
              // Auto select first subordinate document if none selected
              if (subRes.data.length > 0 && !selectedSubDocId) {
                setSelectedSubDocId(subRes.data[0].id);
              }
            } else {
              setSubordinateDocs([]);
            }
          } else {
            setSubordinateDocs([]);
            setDeptDoc(null);
          }
        }
      }
    } catch (err) {
      console.error('Error loading KPI data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCycleId, currentUserRole]);

  // Tab 1 & Tab 2 selections reset sub selection if needed
  useEffect(() => {
    if (activeTab === 'SUBORDINATES' && subordinateDocs.length > 0 && !selectedSubDocId) {
      setSelectedSubDocId(subordinateDocs[0].id);
    }
  }, [activeTab, subordinateDocs]);

  // Document workflow handlers
  const handleSubmitDeptDoc = async (docId: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn gửi duyệt phiếu KPI phòng ban này lên Ban giám đốc?')) return;
    try {
      const res = await kpiDocumentService.submit(docId);
      if (res.success) {
        alert('Gửi duyệt phiếu KPI phòng ban thành công!');
        loadData();
      } else {
        alert('Lỗi: ' + res.message);
      }
    } catch (err) {
      console.error(err);
      alert('Có lỗi xảy ra khi gửi duyệt.');
    }
  };

  const handleApproveSubDoc = async (docId: number) => {
    if (!user?.employeeId) {
      alert('Tài khoản của bạn chưa được liên kết với nhân sự cụ thể để duyệt.');
      return;
    }
    if (!window.confirm('Bạn có chắc chắn phê duyệt phiếu KPI của nhân viên này?')) return;
    try {
      const res = await kpiDocumentService.approve(docId, user.employeeId);
      if (res.success) {
        alert('Phê duyệt phiếu KPI nhân viên thành công!');
        loadData();
      } else {
        alert('Lỗi: ' + res.message);
      }
    } catch (err) {
      console.error(err);
      alert('Có lỗi xảy ra khi phê duyệt.');
    }
  };

  const handleRejectSubDoc = async (docId: number) => {
    if (!rejectReason.trim()) {
      alert('Vui lòng nhập lý do từ chối.');
      return;
    }
    try {
      const res = await kpiDocumentService.reject(docId, rejectReason.trim());
      if (res.success) {
        alert('Đã từ chối duyệt phiếu KPI này.');
        setIsRejecting(false);
        setRejectReason('');
        loadData();
      } else {
        alert('Lỗi: ' + res.message);
      }
    } catch (err) {
      console.error(err);
      alert('Có lỗi xảy ra khi từ chối duyệt.');
    }
  };

  // Helper getters for Admin/Director Tree
  const companyDocs = useMemo(() => allCycleDocs.filter(d => d.targetType === 'COMPANY'), [allCycleDocs]);
  const getDeptDocsForCompany = (compId: number) => allCycleDocs.filter(d => d.targetType === 'DEPARTMENT' && d.parentDocId === compId);
  const getEmpDocsForDept = (deptId: number) => allCycleDocs.filter(d => d.targetType === 'EMPLOYEE' && d.parentDocId === deptId);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'PENDING_APPROVAL': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'APPROVED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'IN_PROGRESS': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'CLOSED': return 'bg-slate-900 text-white border-slate-800';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const getStatusTextVi = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'Bản Nháp';
      case 'PENDING_APPROVAL': return 'Chờ Phê Duyệt';
      case 'APPROVED': return 'Đã Duyệt';
      case 'IN_PROGRESS': return 'Đang Thực Hiện';
      case 'CLOSED': return 'Đã Khóa / Đóng';
      default: return status;
    }
  };

  // Subordinate Details Computed
  const selectedSubDoc = useMemo(() => {
    return subordinateDocs.find(d => d.id === selectedSubDocId) || null;
  }, [subordinateDocs, selectedSubDocId]);

  // Total weight and counts calculations
  const deptDocWeightSum = useMemo(() => {
    if (!deptDoc || !deptDoc.kpiItems) return 0;
    return deptDoc.kpiItems.reduce((acc: number, item: any) => acc + Math.round(item.weight * 100), 0);
  }, [deptDoc]);

  // Page Guards
  if (currentUserRole !== 'ADMIN' && currentUserRole !== 'DIRECTOR' && currentUserRole !== 'MANAGER') {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 italic shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
        Bạn không có quyền truy cập trang thông tin KPI phòng ban này.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-zinc-100 flex items-center gap-2">
            <Building className="w-5 h-5 text-indigo-600 animate-pulse" />
            KPI Cấp Phòng Ban & Phân Bổ Mục Tiêu
          </h2>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            {currentUserRole === 'MANAGER'
              ? `Quản lý mục tiêu của phòng: ${user?.department?.name || 'Chưa rõ phòng'} và đánh giá cấp dưới`
              : 'Xem chi tiết ma trận mục tiêu chiến dịch, phòng ban và liên kết nhân sự'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Cycle Selector */}
          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[10px] font-bold text-slate-500 uppercase">Chu kỳ:</span>
            <select
              value={selectedCycleId}
              onChange={e => {
                setSelectedCycleId(Number(e.target.value));
                setDeptDoc(null);
                setSubordinateDocs([]);
                setSelectedSubDocId(null);
              }}
              className="bg-white border border-slate-200 rounded-lg text-xs font-bold p-1 text-slate-700 focus:outline-none dark:bg-zinc-900 dark:border-zinc-800"
            >
              {cycles.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Quick Create Button for Admin/Director only */}
          {(currentUserRole === 'ADMIN' || currentUserRole === 'DIRECTOR') && (
            <button
              onClick={() => {
                setModalEditingDocId(undefined);
                setModalPresetTargetType(undefined);
                setModalPresetTargetId(undefined);
                setModalPresetParentDocId(undefined);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-[0.98]"
            >
              <Plus className="w-3.5 h-3.5" /> Tạo phiếu KPI mới
            </button>
          )}
        </div>
      </div>

      {/* --- RENDER 1: CASCADING GOALS TREE FOR ADMIN & DIRECTOR --- */}
      {(currentUserRole === 'ADMIN' || currentUserRole === 'DIRECTOR') && (
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 dark:bg-zinc-900 dark:border-zinc-800">
          <h3 className="text-sm font-extrabold uppercase text-slate-500 dark:text-zinc-400 mb-4 flex items-center gap-1.5 border-b border-slate-100 dark:border-zinc-850 pb-3">
            <Network className="w-4.5 h-4.5 text-indigo-600" />
            Ma trận mục tiêu liên kết phân rã (Cascading Goals)
          </h3>

          {isLoading ? (
            <div className="py-12 text-center text-slate-400 font-semibold text-xs animate-pulse">
              Đang tải dữ liệu KPI từ hệ thống...
            </div>
          ) : allCycleDocs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 italic text-xs">
              Chưa có mục tiêu KPI nào được thiết lập trong chu kỳ này.
            </div>
          ) : (
            <div className="border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900">
              <div className="bg-slate-50 p-4 border-b border-slate-200 grid grid-cols-12 text-xs font-bold uppercase text-slate-600 tracking-wider">
                <div className="col-span-6 md:col-span-7">Tên mục tiêu / Liên kết phân rã</div>
                <div className="col-span-3 md:col-span-2 text-center">Cấp đối tượng</div>
                <div className="col-span-3 md:col-span-2 text-right">Trạng thái</div>
                <div className="col-span-1 hidden md:block"></div>
              </div>

              <div className="divide-y divide-slate-200">
                {companyDocs.map(companyDoc => {
                  const deptDocs = getDeptDocsForCompany(companyDoc.id);
                  const isCompExpanded = !!expandedDocs[companyDoc.id];

                  return (
                    <div key={companyDoc.id} className="bg-indigo-50/5">
                      <DocumentTreeRow
                        doc={companyDoc}
                        depth={0}
                        hasChildren={deptDocs.length > 0}
                        isExpanded={isCompExpanded}
                        onToggle={() => setExpandedDocs(prev => ({ ...prev, [companyDoc.id]: !prev[companyDoc.id] }))}
                      />

                      {isCompExpanded && deptDocs.map(deptDoc => {
                        const empDocs = getEmpDocsForDept(deptDoc.id);
                        const isDeptExpanded = !!expandedDocs[deptDoc.id];

                        return (
                          <div key={deptDoc.id}>
                            <DocumentTreeRow
                              doc={deptDoc}
                              depth={1}
                              hasChildren={empDocs.length > 0}
                              isExpanded={isDeptExpanded}
                              onToggle={() => setExpandedDocs(prev => ({ ...prev, [deptDoc.id]: !prev[deptDoc.id] }))}
                            />

                            {isDeptExpanded && empDocs.map(empDoc => (
                              <DocumentTreeRow
                                key={empDoc.id}
                                doc={empDoc}
                                depth={2}
                              />
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}

                {/* Render root documents that are not COMPANY level (e.g. orphan DEPARTMENT/EMPLOYEE docs) */}
                {allCycleDocs.filter(d => d.targetType !== 'COMPANY' && !d.parentDocId).map(orphanDoc => (
                  <DocumentTreeRow key={orphanDoc.id} doc={orphanDoc} depth={0} />
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* --- RENDER 2: MANAGER VIEW (TABS & CORE LOGIC) --- */}
      {currentUserRole === 'MANAGER' && (
        <div className="space-y-6">
          {/* Manager Tabs Panel */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('MY_DEPT')}
              className={`pb-4 px-6 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'MY_DEPT'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <Building className="w-4 h-4" />
              Mục tiêu & KPI của Phòng ban
            </button>
            <button
              onClick={() => setActiveTab('SUBORDINATES')}
              className={`pb-4 px-6 font-bold text-sm border-b-2 transition-all flex items-center gap-2 relative ${
                activeTab === 'SUBORDINATES'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <Users className="w-4 h-4" />
              Đánh giá KPI Nhân viên ({subordinateDocs.length})
              {subordinateDocs.some(d => d.status === 'PENDING_APPROVAL') && (
                <span className="absolute top-0.5 right-2 w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              )}
            </button>
          </div>

          {/* TAB 1: MY DEPARTMENT KPI */}
          {activeTab === 'MY_DEPT' && (
            <div className="space-y-6">
              {isLoading ? (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 font-semibold animate-pulse dark:bg-zinc-900 dark:border-zinc-800">
                  Đang tải thông tin KPI phòng ban...
                </div>
              ) : deptDoc ? (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100 dark:bg-zinc-900 dark:border-zinc-800">
                  {/* Dept Doc Header Details */}
                  <div className="p-6 bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Mã phiếu KPI phòng:</span>
                        <span className="text-sm font-extrabold text-indigo-650">{deptDoc.documentCode}</span>
                      </div>
                      <h3 className="text-base font-extrabold text-slate-800">
                        {deptDoc.targetName || `Phòng ${user?.department?.name}`}
                      </h3>
                      <p className="text-[11px] text-slate-400 font-semibold">
                        Người tạo: <span className="text-slate-600 font-bold">{deptDoc.createdBy}</span>
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      {/* Status badge */}
                      <span className={`inline-flex px-3 py-1.5 text-xs font-bold uppercase rounded-xl border ${getStatusBadgeClass(deptDoc.status)}`}>
                        {getStatusTextVi(deptDoc.status)}
                      </span>

                      {/* Edit Button */}
                      {deptDoc.status === 'DRAFT' && (
                        <>
                          <button
                            onClick={() => {
                              setModalEditingDocId(deptDoc.id);
                              setModalPresetTargetType('DEPARTMENT');
                              setModalPresetTargetId(user?.department?.id);
                              setModalPresetParentDocId(deptDoc.parentDocId || undefined);
                              setIsModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-350 dark:hover:bg-zinc-800 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5 text-slate-500" /> Chỉnh sửa
                          </button>
                          
                          <button
                            onClick={() => handleSubmitDeptDoc(deptDoc.id)}
                            className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-[0.98]"
                          >
                            <Send className="w-3.5 h-3.5" /> Gửi duyệt
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Criteria details table */}
                  <div className="p-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Danh sách chỉ tiêu cụ thể</span>
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-slate-400 font-medium">Tổng trọng số:</span>
                        <span className={`font-extrabold ${deptDocWeightSum === 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {deptDocWeightSum}%
                        </span>
                        {deptDocWeightSum !== 100 && (
                          <span className="text-[10px] bg-amber-50 text-amber-600 border border-amber-200 rounded px-1.5 font-bold flex items-center gap-0.5" title="Tổng trọng số bắt buộc bằng 100% để hợp lệ">
                            <AlertCircle className="w-3 h-3" /> Chưa đủ 100%
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-zinc-900">
                      <table className="min-w-full divide-y divide-slate-200 dark:divide-zinc-800 text-xs">
                        <thead className="bg-slate-50 dark:bg-zinc-800/60">
                          <tr>
                            <th scope="col" className="px-4 py-3 text-left font-bold text-slate-500 dark:text-zinc-400 uppercase w-1/3">Tiêu chí mục tiêu</th>
                            <th scope="col" className="px-3 py-3 text-left font-bold text-slate-500 dark:text-zinc-400 uppercase">Loại mục tiêu</th>
                            <th scope="col" className="px-3 py-3 text-right font-bold text-slate-500 dark:text-zinc-400 uppercase">Chỉ tiêu định mức</th>
                            <th scope="col" className="px-3 py-3 text-right font-bold text-slate-500 dark:text-zinc-400 uppercase">Thực tế đạt được</th>
                            <th scope="col" className="px-3 py-3 text-center font-bold text-slate-500 dark:text-zinc-400 uppercase">Trọng số</th>
                            <th scope="col" className="px-3 py-3 text-left font-bold text-slate-500 dark:text-zinc-400 uppercase">Đơn vị</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white dark:bg-zinc-900 dark:divide-zinc-800 text-slate-700 dark:text-zinc-300">
                          {deptDoc.kpiItems && deptDoc.kpiItems.length > 0 ? (
                            deptDoc.kpiItems.map((item: any) => (
                              <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/40">
                                <td className="px-4 py-3.5 font-semibold">
                                  <p className="text-slate-800 dark:text-zinc-150">{item.name}</p>
                                  {item.description && <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium mt-0.5">{item.description}</p>}
                                </td>
                                <td className="px-3 py-3.5 font-medium text-slate-500 dark:text-zinc-400">
                                  {item.targetType === 'HIGHER_BETTER' ? 'Càng cao tốt hơn' : (item.targetType === 'LOWER_BETTER' ? 'Càng thấp tốt hơn' : 'Đúng mục tiêu')}
                                </td>
                                <td className="px-3 py-3.5 text-right font-bold text-slate-800 dark:text-zinc-200">{item.targetValue}</td>
                                <td className="px-3 py-3.5 text-right font-extrabold text-indigo-600 dark:text-indigo-400">{item.currentValue ?? 0}</td>
                                <td className="px-3 py-3.5 text-center font-extrabold text-amber-700 dark:text-amber-500">
                                  {Math.round(item.weight * 100)}%
                                </td>
                                <td className="px-3 py-3.5 text-slate-500 dark:text-zinc-400 font-semibold">{item.unit}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} className="px-4 py-6 text-center text-slate-450 dark:text-zinc-500 italic">
                                Không có tiêu chí nào trong phiếu này.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                /* Empty state department goals */
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-10 text-center space-y-4 dark:bg-zinc-900 dark:border-zinc-800">
                  <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center mx-auto">
                    <FolderLock className="w-6 h-6 text-indigo-500" />
                  </div>
                  <div className="space-y-1 max-w-sm mx-auto">
                    <h3 className="font-bold text-slate-850 text-sm">Chưa thiết lập KPI phòng ban</h3>
                    <p className="text-xs text-slate-400 font-semibold">
                      Phòng ban của bạn chưa khởi tạo phiếu KPI mục tiêu cho chu kỳ hiện tại. Vui lòng thiết lập ngay để làm cơ sở cascading mục tiêu xuống nhân viên.
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      setModalEditingDocId(undefined);
                      setModalPresetTargetType('DEPARTMENT');
                      setModalPresetTargetId(user?.department?.id);
                      try {
                        const compDocsRes = await kpiDocumentService.search({
                          cycleId: Number(selectedCycleId),
                          targetType: 'COMPANY'
                        });
                        if (compDocsRes.success && compDocsRes.data && compDocsRes.data.length > 0) {
                          setModalPresetParentDocId(compDocsRes.data[0].id);
                        } else {
                          setModalPresetParentDocId(undefined);
                        }
                      } catch (e) {
                        setModalPresetParentDocId(undefined);
                      }
                      setIsModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-4.5 py-2 bg-indigo-650 hover:bg-indigo-750 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-[0.98]"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thiết lập KPI phòng ban
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: EVALUATING SUBORDINATES */}
          {activeTab === 'SUBORDINATES' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left sidebar select subordinate employee */}
              <aside className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4 dark:bg-zinc-900 dark:border-zinc-800">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-zinc-800">
                  <h3 className="font-bold text-slate-800 dark:text-zinc-200 text-sm flex items-center gap-1.5">
                    <Users className="w-4.5 h-4.5 text-indigo-650 dark:text-indigo-400" />
                    KPIs Nhân sự cấp dưới ({subordinateDocs.length})
                  </h3>
                </div>

                {subordinateDocs.length === 0 ? (
                  <p className="text-xs text-slate-450 dark:text-zinc-500 italic py-4 text-center">
                    Chưa có nhân viên nào được thiết lập hoặc phân bổ KPI.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {subordinateDocs.map(doc => {
                      const isSelected = doc.id === selectedSubDocId;
                      return (
                        <button
                          key={doc.id}
                          onClick={() => {
                            setSelectedSubDocId(doc.id);
                            setIsRejecting(false);
                            setRejectReason('');
                          }}
                          className={`w-full p-3.5 rounded-xl border text-left transition-all flex flex-col gap-1.5 ${
                            isSelected
                              ? 'bg-indigo-50/55 border-indigo-300 text-indigo-900 dark:bg-indigo-950/30 dark:border-indigo-800 dark:text-indigo-200 ring-2 ring-indigo-50/20'
                              : 'bg-white border-slate-200 text-slate-600 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800'
                          }`}
                        >
                          <div className="flex justify-between items-center w-full">
                            <span className="font-bold text-xs text-slate-800 dark:text-zinc-200">{doc.targetName}</span>
                            <span className={`px-1.5 py-0.5 text-[8px] font-extrabold border rounded uppercase ${getStatusBadgeClass(doc.status)}`}>
                              {doc.status}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-[10px] text-slate-450 dark:text-zinc-500 font-semibold w-full">
                            <span className="flex items-center gap-0.5"><Briefcase className="w-3.5 h-3.5" /> {doc.documentCode}</span>
                            <span className="font-bold text-amber-700 dark:text-amber-500">{doc.kpiItems?.length || 0} KPIs</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Manager can cascade direct goals to employee */}
                <div className="pt-2">
                  <button
                    disabled={!deptDoc}
                    onClick={() => {
                      setModalEditingDocId(undefined);
                      setModalPresetTargetType('EMPLOYEE');
                      setModalPresetTargetId(undefined); // Let manager select subordinate
                      setModalPresetParentDocId(deptDoc?.id);
                      setIsModalOpen(true);
                    }}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-xs font-bold transition-all shadow-md active:scale-[0.98]"
                  >
                    <Plus className="w-3.5 h-3.5" /> Giao KPI cho nhân viên
                  </button>
                  {!deptDoc && (
                    <p className="text-[10px] text-amber-600 mt-1.5 font-semibold text-center leading-normal">
                      * Yêu cầu thiết lập KPI phòng ban trước khi giao KPI cho nhân sự cấp dưới.
                    </p>
                  )}
                </div>
              </aside>

              {/* Right content detail subordinate doc */}
              <main className="lg:col-span-8 space-y-6">
                {selectedSubDoc ? (
                  <div className="space-y-6">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 dark:bg-zinc-900 dark:border-zinc-800">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-zinc-500">Phiếu KPI nhân viên</span>
                        <h2 className="text-base font-bold text-slate-800 dark:text-zinc-105 animate-pulse-subtle">
                          Nhân sự: <span className="text-indigo-650 dark:text-indigo-400 font-extrabold">{selectedSubDoc.targetName}</span>
                        </h2>
                        <p className="text-[11px] text-slate-400 dark:text-zinc-400 font-medium">Mã phiếu: {selectedSubDoc.documentCode} | Tạo bởi: {selectedSubDoc.createdBy}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Status tag */}
                        <span className={`px-2.5 py-1.5 text-[10px] font-bold uppercase rounded-lg border ${getStatusBadgeClass(selectedSubDoc.status)}`}>
                          {getStatusTextVi(selectedSubDoc.status)}
                        </span>

                        {/* Edit and Submit Actions for Draft subordinate documents */}
                        {selectedSubDoc.status === 'DRAFT' && (
                          <>
                            <button
                              onClick={() => {
                                setModalEditingDocId(selectedSubDoc.id);
                                setModalPresetTargetType('EMPLOYEE');
                                setModalPresetTargetId(selectedSubDoc.targetId);
                                setModalPresetParentDocId(selectedSubDoc.parentDocId || undefined);
                                setIsModalOpen(true);
                              }}
                              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-350 dark:hover:bg-zinc-800 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-sm cursor-pointer animate-[fadeIn_0.15s_ease-out]"
                            >
                              <Pencil className="w-3.5 h-3.5 text-slate-500" /> Chỉnh sửa
                            </button>
                            <button
                              onClick={async () => {
                                if (!window.confirm('Bạn có chắc chắn muốn gửi duyệt phiếu KPI nhân viên này?')) return;
                                try {
                                  const res = await kpiDocumentService.submit(selectedSubDoc.id);
                                  if (res.success) {
                                    alert('Gửi duyệt phiếu KPI nhân viên thành công!');
                                    loadData();
                                  } else {
                                    alert('Lỗi: ' + res.message);
                                  }
                                } catch (err) {
                                  console.error(err);
                                  alert('Có lỗi xảy ra khi gửi duyệt.');
                                }
                              }}
                              className="px-3.5 py-1.5 bg-indigo-650 hover:bg-indigo-750 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-md active:scale-[0.98] animate-[fadeIn_0.15s_ease-out]"
                            >
                              <Send className="w-3.5 h-3.5" /> Gửi duyệt
                            </button>
                          </>
                        )}

                        {/* Approve/Reject Actions */}
                        {selectedSubDoc.status === 'PENDING_APPROVAL' && (
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleApproveSubDoc(selectedSubDoc.id)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-sm cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Phê duyệt
                            </button>
                            <button
                              onClick={() => setIsRejecting(true)}
                              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-sm cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Từ chối
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Reject reason input popup */}
                    {isRejecting && (
                      <div className="bg-rose-50 border border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/60 p-4 rounded-xl space-y-3 animate-[fadeIn_0.15s_ease-out]">
                        <label className="text-xs font-bold text-rose-800 dark:text-rose-300 block">Lý lý do từ chối phê duyệt:</label>
                        <textarea
                          rows={2}
                          value={rejectReason}
                          onChange={e => setRejectReason(e.target.value)}
                          placeholder="VD: Thiếu chỉ tiêu KPI doanh số, Trọng số phân bổ chưa hợp lý..."
                          className="w-full border border-rose-200 dark:border-zinc-700 rounded-xl p-2.5 text-xs text-slate-700 dark:text-zinc-200 bg-white dark:bg-zinc-800 font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleRejectSubDoc(selectedSubDoc.id)}
                            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                          >
                            Xác nhận từ chối
                          </button>
                          <button
                            onClick={() => {
                              setIsRejecting(false);
                              setRejectReason('');
                            }}
                            className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition-all dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 cursor-pointer"
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Subordinate KPI items list */}
                    <div className="space-y-4">
                      {selectedSubDoc.kpiItems && selectedSubDoc.kpiItems.length > 0 ? (
                        selectedSubDoc.kpiItems.map((item: any) => {
                          const progress = item.targetValue > 0 ? Math.min(100, Math.round(((item.currentValue || 0) / item.targetValue) * 100)) : 0;
                          return (
                            <div key={item.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100 dark:bg-zinc-900 dark:border-zinc-800">
                              <div className="p-4 bg-slate-50/50 dark:bg-zinc-900/50 flex justify-between items-start gap-4">
                                <div>
                                  <h4 className="font-bold text-slate-800 dark:text-zinc-250 text-xs">{item.name}</h4>
                                  {item.description && <p className="text-[10px] text-slate-400 dark:text-zinc-550 font-medium mt-0.5">{item.description}</p>}
                                </div>
                                <span className="px-2 py-0.5 text-[10px] font-extrabold text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/20 rounded border border-amber-100 dark:border-amber-900/50">
                                  Trọng số: {Math.round(item.weight * 100)}%
                                </span>
                              </div>

                              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-zinc-400 tracking-wider">Tiến trình chỉ tiêu</span>
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="bg-slate-50 dark:bg-zinc-850 p-2.5 rounded-lg border border-slate-100 dark:border-zinc-800">
                                      <span className="block text-[9px] font-semibold text-slate-400 dark:text-zinc-500">CHỈ TIÊU</span>
                                      <span className="font-bold text-slate-700 dark:text-zinc-300">{item.targetValue.toLocaleString()} {item.unit}</span>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-zinc-850 p-2.5 rounded-lg border border-slate-100 dark:border-zinc-800">
                                      <span className="block text-[9px] font-semibold text-slate-400 dark:text-zinc-500">THỰC TẾ</span>
                                      <span className="font-bold text-indigo-650 dark:text-indigo-400">{item.currentValue?.toLocaleString() || 0} {item.unit}</span>
                                    </div>
                                  </div>
                                  
                                  {/* Progress bar */}
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-bold">
                                      <span className="text-slate-400 dark:text-zinc-400">Tỷ lệ hoàn thành</span>
                                      <span className="text-indigo-600 dark:text-indigo-400">{progress}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                                      <div
                                        className="bg-indigo-600 dark:bg-indigo-500 h-1.5 rounded-full transition-all duration-300"
                                        style={{ width: `${progress}%` }}
                                      />
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-2 border-t md:border-t-0 md:border-l border-slate-100 dark:border-zinc-800 md:pl-4">
                                  <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-zinc-400 tracking-wider block">Báo cáo tự chấm điểm</span>
                                  {item.selfScore !== undefined && item.selfScore !== null ? (
                                    <div className="bg-amber-50/50 dark:bg-amber-950/20 p-3 rounded-lg border border-amber-100 dark:border-amber-900/60 flex items-center justify-between text-xs">
                                      <span className="font-bold text-slate-600 dark:text-zinc-350">Nhân viên tự đánh giá:</span>
                                      <span className="font-extrabold text-amber-700 dark:text-amber-450 text-sm">{item.selfScore} / 100</span>
                                    </div>
                                  ) : (
                                    <p className="text-[11px] text-slate-400 dark:text-zinc-500 italic">Chưa có kết quả tự chấm điểm của nhân viên.</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center text-slate-400 italic dark:bg-zinc-900 dark:border-zinc-800">
                          Phiếu KPI của nhân viên này chưa có tiêu chí nào.
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center text-slate-400 italic dark:bg-zinc-900 dark:border-zinc-800">
                    Vui lòng chọn nhân viên ở danh sách bên trái để xem chi tiết.
                  </div>
                )}
              </main>
            </div>
          )}
        </div>
      )}

      {/* --- RENDER 3: CREATE & EDIT MODAL --- */}
      {isModalOpen && selectedCycleId && (
        <CreateKpiDocumentModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setModalEditingDocId(undefined);
            setModalPresetTargetType(undefined);
            setModalPresetTargetId(undefined);
            setModalPresetParentDocId(undefined);
          }}
          selectedCycleId={Number(selectedCycleId)}
          editingDocId={modalEditingDocId}
          presetTargetType={modalPresetTargetType}
          presetTargetId={modalPresetTargetId}
          presetParentDocId={modalPresetParentDocId}
          onSuccess={loadData}
        />
      )}
    </div>
  );

  // Tree row helper component for Admin/Director
  function DocumentTreeRow({
    doc,
    depth,
    hasChildren = false,
    isExpanded = false,
    onToggle
  }: {
    doc: any;
    depth: number;
    hasChildren?: boolean;
    isExpanded?: boolean;
    onToggle?: () => void;
  }) {
    const isItemsExpanded = !!expandedItems[doc.id];
    const indentStyles = [
      'pl-4',
      'pl-10 bg-slate-50/20 dark:bg-zinc-900/10',
      'pl-16 bg-white dark:bg-zinc-900'
    ];

    const targetLabel = doc.targetType === 'COMPANY' ? 'TẬP ĐOÀN' : (doc.targetType === 'DEPARTMENT' ? 'PHÒNG BAN' : 'NHÂN VIÊN');
    const targetBadgeClass = doc.targetType === 'COMPANY' 
      ? 'bg-indigo-600 text-white' 
      : (doc.targetType === 'DEPARTMENT' ? 'bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/60' : 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700');

    return (
      <div className="divide-y divide-slate-100 dark:divide-zinc-800">
        <div className={`p-4 grid grid-cols-12 items-center hover:bg-slate-50/80 dark:hover:bg-zinc-850/40 transition-colors ${indentStyles[depth]}`}>
          {/* Code and Object Title */}
          <div className="col-span-6 md:col-span-7 flex items-center gap-2 min-w-0">
            {hasChildren ? (
              <button onClick={onToggle} className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-0.5 cursor-pointer">
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            ) : (
              <span className="w-5" />
            )}
            
            {doc.targetType === 'COMPANY' ? (
              <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-450 flex-shrink-0" />
            ) : doc.targetType === 'DEPARTMENT' ? (
              <Building className="w-4 h-4 text-blue-500 dark:text-blue-400 flex-shrink-0" />
            ) : (
              <User className="w-4 h-4 text-slate-500 dark:text-zinc-400 flex-shrink-0" />
            )}

            <div className="min-w-0">
              <span className="font-extrabold text-slate-800 dark:text-zinc-200 text-xs md:text-sm block truncate">
                {doc.documentCode} - {doc.targetName}
              </span>
              {doc.targetType === 'EMPLOYEE' && (
                <span className="text-[9px] text-slate-450 dark:text-zinc-500 font-semibold">
                  Tạo bởi: {doc.createdBy || 'Hệ thống'}
                </span>
              )}
            </div>
          </div>

          {/* Target Type */}
          <div className="col-span-3 md:col-span-2 text-center">
            <span className={`inline-block px-2 py-0.5 text-[8px] font-extrabold rounded ${targetBadgeClass}`}>
              {targetLabel}
            </span>
          </div>

          {/* Status */}
          <div className="col-span-3 md:col-span-2 text-right">
            <span className={`inline-flex px-2 py-0.5 text-[8px] font-extrabold uppercase rounded border ${getStatusBadgeClass(doc.status)}`}>
              {doc.status}
            </span>
          </div>

          {/* Actions */}
          <div className="col-span-1 text-right flex items-center justify-end gap-1.5">
            {doc.status === 'DRAFT' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setModalEditingDocId(doc.id);
                  setModalPresetTargetType(doc.targetType);
                  setModalPresetTargetId(doc.targetId);
                  setModalPresetParentDocId(doc.parentDocId || undefined);
                  setIsModalOpen(true);
                }}
                className="text-slate-500 hover:text-indigo-600 p-1 hover:bg-slate-100 rounded-lg transition-colors"
                title="Chỉnh sửa phiếu KPI này"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => setExpandedItems(prev => ({ ...prev, [doc.id]: !prev[doc.id] }))}
              className="text-indigo-600 hover:text-indigo-800 text-xs font-bold transition-all p-1 hover:bg-indigo-50 rounded-lg"
              title="Xem danh sách tiêu chí cụ thể"
            >
              {isItemsExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Embedded Items Table */}
        {isItemsExpanded && (
          <div className="bg-slate-50/50 dark:bg-zinc-950/20 p-4 border-t border-b border-slate-150 dark:border-zinc-800 animate-[fadeIn_0.15s_ease-out]">
            <div className="max-w-4xl mx-auto bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden dark:bg-zinc-900 dark:border-zinc-800">
              <div className="bg-slate-100 dark:bg-zinc-850 p-2.5 px-4 text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider border-b border-slate-200 dark:border-zinc-800">
                Chi tiết tiêu chí KPI bên trong phiếu
              </div>
              <table className="min-w-full divide-y divide-slate-200 dark:divide-zinc-800 text-xs">
                <thead className="bg-slate-50 dark:bg-zinc-900/50">
                  <tr>
                    <th scope="col" className="px-4 py-2 text-left font-bold text-slate-500 dark:text-zinc-450 uppercase w-1/3">Tiêu chí</th>
                    <th scope="col" className="px-3 py-2 text-left font-bold text-slate-500 dark:text-zinc-450 uppercase">Loại mục tiêu</th>
                    <th scope="col" className="px-3 py-2 text-right font-bold text-slate-500 dark:text-zinc-450 uppercase">Chỉ tiêu</th>
                    <th scope="col" className="px-3 py-2 text-right font-bold text-slate-500 dark:text-zinc-450 uppercase">Thực tế</th>
                    <th scope="col" className="px-3 py-2 text-center font-bold text-slate-500 dark:text-zinc-450 uppercase">Trọng số</th>
                    <th scope="col" className="px-3 py-2 text-left font-bold text-slate-500 dark:text-zinc-450 uppercase">Đơn vị</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white dark:bg-zinc-900 dark:divide-zinc-800 text-slate-700 dark:text-zinc-300">
                  {doc.kpiItems && doc.kpiItems.length > 0 ? (
                    doc.kpiItems.map((item: any) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-850/40">
                        <td className="px-4 py-2 font-semibold">
                          <p>{item.name}</p>
                          {item.description && <p className="text-[10px] text-slate-400 dark:text-zinc-550 font-medium">{item.description}</p>}
                        </td>
                        <td className="px-3 py-2 font-medium">
                          {item.targetType === 'HIGHER_BETTER' ? 'Càng cao tốt hơn' : (item.targetType === 'LOWER_BETTER' ? 'Càng thấp tốt hơn' : 'Đúng mục tiêu')}
                        </td>
                        <td className="px-3 py-2 text-right font-bold">{item.targetValue}</td>
                        <td className="px-3 py-2 text-right font-bold text-indigo-650 dark:text-indigo-400">{item.currentValue ?? 0}</td>
                        <td className="px-3 py-2 text-center font-bold text-amber-700 dark:text-amber-500">
                          {Math.round(item.weight * 100)}%
                        </td>
                        <td className="px-3 py-2 text-slate-500 dark:text-zinc-450 font-semibold">{item.unit}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-4 text-center text-slate-400 italic">
                        Không có tiêu chí nào trong phiếu này.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }
};

export default KpisDepartmentPage;
