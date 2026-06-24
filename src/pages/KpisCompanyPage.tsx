import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../features/auth';
import { kpiDocumentService } from '../features/kpi-document';
import { catalogService } from '../features/admin-catalog/services/catalogService';
import { CreateKpiDocumentModal } from '../features/kpi-document';
import { DocRow } from '../features/kpi-document/components/KpiDocumentTree';
import { StatPill } from '../components/ui';
import {
  Target, Plus,
  FileText, CheckCircle2, Clock,
  TrendingUp, AlertTriangle, RefreshCw
} from 'lucide-react';

const STATUS_FILTERS = ['', 'DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'IN_PROGRESS', 'CLOSED'];
const STATUS_FILTER_LABELS = ['Tất cả', 'Nháp', 'Chờ duyệt', 'Đã duyệt', 'Thực hiện', 'Đã đóng'];


/* ─── page ───────────────────────────────────────────────────── */

export const KpisCompanyPage: React.FC = () => {
  const { user } = useAuth();

  const [cycles, setCycles]               = useState<any[]>([]);
  const [selectedCycleId, setSelectedCycleId] = useState<number | ''>('');
  const [documents, setDocuments]         = useState<any[]>([]);
  const [isLoading, setIsLoading]         = useState(false);
  const [filterStatus, setFilterStatus]   = useState('');
  const [expandedDocs, setExpandedDocs]   = useState<Set<number>>(new Set());
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [modalOpen, setModalOpen]         = useState(false);
  const [editingDocId, setEditingDocId]   = useState<number | undefined>();

  /* fetch cycles */
  useEffect(() => {
    catalogService.fetchAllForDropdown<any>('/kpi-cycles').then(res => {
      setCycles(res);
      const active = res.find((c: any) => c.status === 'ACTIVE') || res[0];
      if (active) setSelectedCycleId(active.id);
    }).catch(console.error);
  }, []);

  /* fetch documents */
  const fetchDocuments = async () => {
    if (!selectedCycleId) return;
    setIsLoading(true);
    try {
      const payload: any = { cycleId: selectedCycleId };
      if (filterStatus) payload.status = filterStatus;
      const res = await kpiDocumentService.search(payload);
      if (res.success && res.data) {
        setDocuments(res.data);
        // auto-expand company level
        const compIds = res.data.filter((d: any) => d.targetType === 'COMPANY').map((d: any) => d.id);
        setExpandedDocs(new Set(compIds));
        setExpandedItems(new Set());
      }
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchDocuments(); }, [selectedCycleId, filterStatus]);

  /* tree helpers */
  const companyDocs = useMemo(() => documents.filter(d => d.targetType === 'COMPANY'), [documents]);
  const deptDocsOf  = (pid: number) => documents.filter(d => d.targetType === 'DEPARTMENT' && d.parentDocId === pid);
  const empDocsOf   = (pid: number) => documents.filter(d => d.targetType === 'EMPLOYEE' && d.parentDocId === pid);

  const toggleDoc   = (id: number) => setExpandedDocs  (p => { const s = new Set(p); s.has(id) ? s.delete(id) : s.add(id); return s; });
  const toggleItems = (id: number) => setExpandedItems (p => { const s = new Set(p); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const openCreate = () => { setEditingDocId(undefined); setModalOpen(true); };
  const openEdit   = (id: number) => { setEditingDocId(id); setModalOpen(true); };

  /* stats */
  const stats = useMemo(() => ({
    total:   documents.length,
    draft:   documents.filter(d => d.status === 'DRAFT').length,
    pending: documents.filter(d => d.status === 'PENDING_APPROVAL').length,
    approved:documents.filter(d => d.status === 'APPROVED').length,
  }), [documents]);

  if (user?.role !== 'ADMIN' && user?.role !== 'DIRECTOR') {
    return <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 italic text-sm shadow-sm">Bạn không có quyền truy cập trang này.</div>;
  }

  return (
    <div className="space-y-5">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-100"><Target className="w-4 h-4 text-indigo-600" /></div>
            Ma trận KPI Toàn Công Ty
          </h2>
          <p className="text-[11px] text-slate-400 font-semibold mt-1.5 ml-9">
            Phân rã mục tiêu từ cấp Công ty → Phòng ban → Nhân viên
          </p>
        </div>

        {/* Stat pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <StatPill icon={<FileText className="w-3 h-3"/>} label="Tổng" value={stats.total} color="text-slate-600 bg-slate-100"/>
          <StatPill icon={<AlertTriangle className="w-3 h-3"/>} label="Nháp" value={stats.draft} color="text-slate-500 bg-slate-100"/>
          <StatPill icon={<Clock className="w-3 h-3"/>} label="Chờ duyệt" value={stats.pending} color="text-amber-700 bg-amber-50"/>
          <StatPill icon={<CheckCircle2 className="w-3 h-3"/>} label="Đã duyệt" value={stats.approved} color="text-emerald-700 bg-emerald-50"/>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow transition-all active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5"/> Tạo phiếu mới
          </button>
        </div>
      </div>

      {/* ── Filter bar ─────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Cycle picker */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Chu kỳ</span>
          <select
            value={selectedCycleId}
            onChange={e => setSelectedCycleId(Number(e.target.value))}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <option value="">-- Chọn --</option>
            {cycles.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="w-px h-5 bg-slate-200 hidden sm:block"/>

        {/* Status pill tabs */}
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((s, i) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1 text-[11px] font-bold rounded-lg border transition-all ${
                filterStatus === s
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700'
              }`}
            >
              {STATUS_FILTER_LABELS[i]}
            </button>
          ))}
        </div>

        {/* Refresh */}
        <button
          onClick={fetchDocuments}
          disabled={isLoading}
          className="ml-auto inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`}/>
        </button>
      </div>

      {/* ── Tree ───────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 flex flex-col items-center gap-3 text-slate-400">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-indigo-500"/>
            <span className="text-xs font-semibold">Đang tải dữ liệu...</span>
          </div>
        ) : documents.length === 0 ? (
          <div className="py-16 text-center">
            <TrendingUp className="w-10 h-10 text-slate-200 mx-auto mb-3"/>
            <p className="text-sm font-bold text-slate-400">Chưa có phiếu KPI nào</p>
            <p className="text-xs text-slate-300 mt-1">Chọn chu kỳ khác hoặc tạo phiếu KPI đầu tiên</p>
            <button onClick={openCreate} className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow">
              <Plus className="w-3.5 h-3.5"/> Tạo phiếu KPI
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {companyDocs.map(compDoc => {
              const depts = deptDocsOf(compDoc.id);
              return (
                <div key={compDoc.id}>
                  {/* ── Company row ── */}
                  <DocRow
                    doc={compDoc} depth={0}
                    hasChildren={depts.length > 0}
                    isExpanded={expandedDocs.has(compDoc.id)}
                    onToggle={() => toggleDoc(compDoc.id)}
                    isItemsExpanded={expandedItems.has(compDoc.id)}
                    onToggleItems={() => toggleItems(compDoc.id)}
                    onEdit={() => openEdit(compDoc.id)}
                  />

                  {expandedDocs.has(compDoc.id) && depts.map(deptDoc => {
                    const emps = empDocsOf(deptDoc.id);
                    return (
                      <div key={deptDoc.id} className="bg-slate-50/40">
                        {/* ── Dept row ── */}
                        <DocRow
                          doc={deptDoc} depth={1}
                          hasChildren={emps.length > 0}
                          isExpanded={expandedDocs.has(deptDoc.id)}
                          onToggle={() => toggleDoc(deptDoc.id)}
                          isItemsExpanded={expandedItems.has(deptDoc.id)}
                          onToggleItems={() => toggleItems(deptDoc.id)}
                          onEdit={() => openEdit(deptDoc.id)}
                        />

                        {expandedDocs.has(deptDoc.id) && emps.map(empDoc => (
                          <div key={empDoc.id} className="bg-white">
                            <DocRow
                              doc={empDoc} depth={2}
                              isItemsExpanded={expandedItems.has(empDoc.id)}
                              onToggleItems={() => toggleItems(empDoc.id)}
                              onEdit={() => openEdit(empDoc.id)}
                            />
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* Orphan docs (no company parent) */}
            {documents.filter(d => d.targetType !== 'COMPANY' && !d.parentDocId).map(doc => (
              <DocRow key={doc.id} doc={doc} depth={0}
                isItemsExpanded={expandedItems.has(doc.id)}
                onToggleItems={() => toggleItems(doc.id)}
                onEdit={() => openEdit(doc.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Modal ──────────────────────────────────────────── */}
      {modalOpen && (
        <CreateKpiDocumentModal
          isOpen={modalOpen}
          onClose={() => { setModalOpen(false); setEditingDocId(undefined); }}
          selectedCycleId={Number(selectedCycleId) || 0}
          editingDocId={editingDocId}
          onSuccess={fetchDocuments}
        />
      )}
    </div>
  );
};

export default KpisCompanyPage;

