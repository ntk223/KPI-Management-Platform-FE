import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../features/auth';
import { kpiDocumentService } from '../features/kpi-document';
import { catalogService } from '../features/admin-catalog/services/catalogService';
import { CreateKpiDocumentModal } from '../features/kpi-document';
import { STATUS_VI, STATUS_CLASS } from '../features/kpi-document/components/KpiDocumentTree';
import { PageHeader, Button, Card } from '../components/ui';
import {
  Target, Building2, User, FileText, Plus, RefreshCw,
  ChevronRight, ChevronDown, Pencil, BarChart3, Calendar,
  Hash, Layers, CheckCircle2, Clock, AlertTriangle, TrendingUp
} from 'lucide-react';

/* ── types ─────────────────────────────────────────────────────── */
type KpiDoc = any;

/* ── status helpers ─────────────────────────────────────────────── */
const STATUS_FILTERS = ['', 'DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'IN_PROGRESS', 'CLOSED'];
const STATUS_LABELS  = ['Tất cả', 'Nháp', 'Chờ duyệt', 'Đã duyệt', 'Thực hiện', 'Đã đóng'];

const TYPE_CONFIG = {
  COMPANY:    { Icon: Target,    color: 'text-indigo-600', bg: 'bg-indigo-100', label: 'Công ty'  },
  DEPARTMENT: { Icon: Building2, color: 'text-sky-600',    bg: 'bg-sky-100',    label: 'Phòng ban'},
  EMPLOYEE:   { Icon: User,      color: 'text-slate-500',  bg: 'bg-slate-100',  label: 'Nhân viên'},
};

/* ══════════════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════════════ */
export const KpisCompanyPage: React.FC = () => {
  const { user } = useAuth();

  const [cycles, setCycles]           = useState<any[]>([]);
  const [cycleId, setCycleId]         = useState<number | ''>('');
  const [documents, setDocuments]     = useState<KpiDoc[]>([]);
  const [isLoading, setIsLoading]     = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<KpiDoc | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [modalOpen, setModalOpen]     = useState(false);
  const [editingDocId, setEditingDocId] = useState<number | undefined>();

  useEffect(() => {
    catalogService.fetchAllForDropdown<any>('/kpi-cycles').then(res => {
      setCycles(res);
      const active = res.find((c: any) => c.status === 'ACTIVE') || res[0];
      if (active) setCycleId(active.id);
    }).catch(console.error);
  }, []);

  const fetchDocuments = async () => {
    if (!cycleId) return;
    setIsLoading(true);
    try {
      const payload: any = { cycleId };
      if (filterStatus) payload.status = filterStatus;
      const res = await kpiDocumentService.search(payload);
      if (res.success && res.data) {
        setDocuments(res.data);
        const compIds = res.data.filter((d: any) => d.targetType === 'COMPANY').map((d: any) => d.id);
        setExpandedIds(new Set(compIds));
        setSelectedDoc(null);
      }
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchDocuments(); }, [cycleId, filterStatus]);

  const companyDocs = useMemo(() => documents.filter(d => d.targetType === 'COMPANY'), [documents]);
  const childrenOf  = (pid: number, type: string) => documents.filter(d => d.targetType === type && d.parentDocId === pid);

  const toggle = (id: number) => setExpandedIds(p => { const s = new Set(p); s.has(id) ? s.delete(id) : s.add(id); return s; });

  if (user?.role !== 'ADMIN' && user?.role !== 'DIRECTOR') {
    return <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 italic text-sm dark:bg-zinc-900 dark:border-zinc-800">Bạn không có quyền truy cập.</div>;
  }

  return (
    <div className="flex flex-col gap-4 h-full">

      {/* ── Page Header (đồng bộ với các trang khác) ────────── */}
      <PageHeader
        icon={<Target className="w-5 h-5 text-indigo-600" />}
        title="Ma trận KPI Toàn Công Ty"
        subtitle="Phân rã mục tiêu từ cấp Công ty → Phòng ban → Nhân viên"
        actions={
          <Button
            variant="primary"
            size="md"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => { setEditingDocId(undefined); setModalOpen(true); }}
          >
            Tạo phiếu mới
          </Button>
        }
      />

      {/* ── Filter bar (tách riêng khỏi header) ─────────────── */}
      <Card padding="md" className="flex flex-wrap items-center gap-3">
        {/* Cycle picker */}
        <div className="flex items-center gap-2 shrink-0">
          <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <select
            value={cycleId}
            onChange={e => setCycleId(Number(e.target.value))}
            className="h-9 border border-slate-200 rounded-lg px-3 text-sm font-medium text-slate-700 bg-white dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
          >
            <option value="">-- Chọn chu kỳ --</option>
            {cycles.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="w-px h-6 bg-slate-200 dark:bg-zinc-800 hidden sm:block" />

        {/* Status pill tabs */}
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((s, i) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-md border transition-all ${
                filterStatus === s
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-white text-slate-500 border-slate-200 hover:text-slate-700 hover:border-slate-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-100'
              }`}
            >
              {STATUS_LABELS[i]}
            </button>
          ))}
        </div>

        {/* Refresh */}
        <Button
          variant="secondary"
          size="sm"
          icon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          disabled={isLoading}
          onClick={fetchDocuments}
          className="ml-auto"
        >
          {isLoading ? 'Đang tải...' : 'Làm mới'}
        </Button>
      </Card>

      {/* ── Split Pane ──────────────────────────────────────── */}
      <div className="flex gap-4 flex-1 min-h-0" style={{ height: 'calc(100vh - 220px)' }}>

        {/* LEFT: Tree ──────────────────────────────────────── */}
        <div className="w-[30%] min-w-[260px] bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden dark:bg-zinc-900 dark:border-zinc-800">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-zinc-850 flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-400 dark:text-zinc-500"/>
            <span className="text-xs font-extrabold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">Cây phân cấp</span>
            <span className="ml-auto text-[10px] font-bold text-slate-400 dark:text-zinc-550 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">{documents.length} phiếu</span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"/>
                <span className="text-xs text-slate-400 font-semibold">Đang tải...</span>
              </div>
            ) : documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2 text-slate-400">
                <TrendingUp className="w-8 h-8 text-slate-200"/>
                <p className="text-xs font-semibold">Chưa có dữ liệu</p>
              </div>
            ) : (
              <div className="py-2">
                {companyDocs.map(compDoc => (
                  <TreeSection
                    key={compDoc.id}
                    doc={compDoc}
                    depth={0}
                    children={childrenOf(compDoc.id, 'DEPARTMENT')}
                    grandChildrenOf={id => childrenOf(id, 'EMPLOYEE')}
                    expandedIds={expandedIds}
                    selectedId={selectedDoc?.id}
                    onToggle={toggle}
                    onSelect={setSelectedDoc}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Detail Panel ─────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          {selectedDoc ? (
            <DetailPanel
              doc={selectedDoc}
              subordinates={selectedDoc.targetType === 'DEPARTMENT'
                ? documents.filter(d => d.targetType === 'EMPLOYEE' && d.parentDocId === selectedDoc.id)
                : []}
              onEdit={() => { setEditingDocId(selectedDoc.id); setModalOpen(true); }}
            />
          ) : (
            <div className="h-full bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center gap-3 text-slate-400 dark:bg-zinc-900 dark:border-zinc-800">
              <BarChart3 className="w-12 h-12 text-slate-200 dark:text-zinc-800"/>
              <p className="text-sm font-bold text-slate-400 dark:text-zinc-500">Chọn một phiếu KPI để xem chi tiết</p>
              <p className="text-xs text-slate-300 dark:text-zinc-600">Nhấn vào bất kỳ nút nào trong cây bên trái</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <CreateKpiDocumentModal
          isOpen={modalOpen}
          onClose={() => { setModalOpen(false); setEditingDocId(undefined); }}
          selectedCycleId={Number(cycleId) || 0}
          editingDocId={editingDocId}
          onSuccess={fetchDocuments}
        />
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════
   TREE SECTION
══════════════════════════════════════════════════════════════════ */
function TreeSection({ doc, depth, children, grandChildrenOf, expandedIds, selectedId, onToggle, onSelect }: {
  doc: KpiDoc; depth: number;
  children: KpiDoc[];
  grandChildrenOf: (id: number) => KpiDoc[];
  expandedIds: Set<number>;
  selectedId?: number;
  onToggle: (id: number) => void;
  onSelect: (doc: KpiDoc) => void;
}) {
  const isExpanded = expandedIds.has(doc.id);
  const isSelected = selectedId === doc.id;
  const cfg = TYPE_CONFIG[doc.targetType as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.EMPLOYEE;
  const { Icon, color, bg } = cfg;
  const indent = depth * 16;

  return (
    <div>
      <button
        onClick={() => { onSelect(doc); if (children.length > 0) onToggle(doc.id); }}
        className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors rounded-lg mx-1 cursor-pointer ${
          isSelected ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-350' : 'hover:bg-slate-50 text-slate-700 dark:hover:bg-zinc-800 dark:text-zinc-300'
        }`}
        style={{ paddingLeft: `${12 + indent}px` }}
      >
        {children.length > 0 ? (
          <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center text-slate-400 dark:text-zinc-500">
            {isExpanded ? <ChevronDown className="w-3 h-3"/> : <ChevronRight className="w-3 h-3"/>}
          </span>
        ) : <span className="w-4 flex-shrink-0"/>}

        <span className={`flex-shrink-0 p-1 rounded-md ${isSelected ? 'bg-indigo-100 dark:bg-indigo-900/60' : bg}`}>
          <Icon className={`w-3 h-3 ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : color}`}/>
        </span>

        <span className="flex-1 min-w-0">
          <span className="block text-[11px] font-bold truncate">{doc.targetName}</span>
          <span className="block text-[9px] text-slate-400 dark:text-zinc-500 truncate">{doc.documentCode}</span>
        </span>

        <span className={`flex-shrink-0 inline-block px-1.5 py-0.5 text-[8px] font-extrabold uppercase rounded border ${STATUS_CLASS[doc.status] ?? 'bg-slate-100 text-slate-500 border-slate-200'}`}>
          {STATUS_VI[doc.status] ?? doc.status}
        </span>
      </button>

      {isExpanded && children.map(child => (
        <TreeSection
          key={child.id} doc={child} depth={depth + 1}
          children={grandChildrenOf(child.id)}
          grandChildrenOf={() => []}
          expandedIds={expandedIds} selectedId={selectedId}
          onToggle={onToggle} onSelect={onSelect}
        />
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   DETAIL PANEL
══════════════════════════════════════════════════════════════════ */
function DetailPanel({ doc, subordinates, onEdit }: { doc: KpiDoc; subordinates: KpiDoc[]; onEdit: () => void }) {
  const cfg = TYPE_CONFIG[doc.targetType as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.EMPLOYEE;
  const { Icon, color, bg } = cfg;

  return (
    <div className="space-y-4">
      {/* Card header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 dark:bg-zinc-900 dark:border-zinc-800">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-2xl ${bg} flex-shrink-0`}>
              <Icon className={`w-6 h-6 ${color}`}/>
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-zinc-50 leading-tight">{doc.targetName}</h1>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-zinc-450 font-semibold">
                  <Hash className="w-3 h-3"/> {doc.documentCode}
                </span>
                <span className="text-slate-200">·</span>
                <span className={`inline-flex px-2.5 py-1 text-xs font-bold uppercase rounded-lg border ${STATUS_CLASS[doc.status] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                  {STATUS_VI[doc.status] ?? doc.status}
                </span>
                <span className="text-slate-200">·</span>
                <span className={`text-xs font-bold ${color}`}>{cfg.label}</span>
              </div>
            </div>
          </div>
          {doc.status === 'DRAFT' && (
            <button onClick={onEdit}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition-all shadow-sm dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-350 dark:hover:bg-zinc-800 cursor-pointer">
              <Pencil className="w-3.5 h-3.5"/> Chỉnh sửa
            </button>
          )}
        </div>

        {/* Summary stats */}
        <div className="mt-5 grid grid-cols-3 gap-3">
          <SummaryTile icon={<FileText className="w-4 h-4 text-slate-500"/>}
            label="Tiêu chí" value={doc.kpiItems?.length ?? 0} color="text-slate-800"/>
          <SummaryTile icon={<CheckCircle2 className="w-4 h-4 text-emerald-500"/>}
            label="Hoàn thành" value={`${overallPct(doc.kpiItems)}%`} color="text-emerald-700"/>
          <SummaryTile icon={<Clock className="w-4 h-4 text-amber-500"/>}
            label="Trạng thái" value={STATUS_VI[doc.status] ?? doc.status} color="text-amber-700"/>
        </div>
      </div>

      {/* KPI Items */}
      {doc.kpiItems?.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden dark:bg-zinc-900 dark:border-zinc-800">
          <div className="px-6 py-3 border-b border-slate-100 dark:border-zinc-850 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-550"/>
            <span className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">Tiêu chí KPI</span>
            <span className="ml-auto text-[10px] font-bold text-slate-400 dark:text-zinc-550 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">{doc.kpiItems.length} mục</span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-zinc-800">
            {doc.kpiItems.map((item: any) => {
              const pct = item.targetValue > 0 ? Math.min(100, Math.round((item.currentValue ?? 0) / item.targetValue * 100)) : 0;
              const barColor = pct >= 100 ? 'bg-emerald-500' : pct >= 60 ? 'bg-indigo-500' : 'bg-amber-500';
              return (
                <div key={item.id} className="px-6 py-4 hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-start justify-between gap-4 mb-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800">{item.name}</p>
                      {item.description && <p className="text-[11px] text-slate-400 mt-0.5">{item.description}</p>}
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-2">
                      <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-lg">
                        Trọng số {Math.round(item.weight * 100)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${pct}%` }}/>
                    </div>
                    <span className="text-xs font-extrabold text-slate-600 whitespace-nowrap w-12 text-right">{pct}%</span>
                    <span className="text-[10px] text-slate-400 font-semibold whitespace-nowrap">
                      {item.currentValue ?? 0}/{item.targetValue} {item.unit}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Subordinates table (only for DEPARTMENT nodes) */}
      {subordinates.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden dark:bg-zinc-900 dark:border-zinc-800">
          <div className="px-6 py-3 border-b border-slate-100 dark:border-zinc-850 flex items-center gap-2">
            <User className="w-4 h-4 text-slate-400 dark:text-zinc-500"/>
            <span className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">Nhân viên trong phòng</span>
            <span className="ml-auto text-[10px] font-bold text-slate-400 dark:text-zinc-550 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">{subordinates.length} người</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-3 text-left font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">Tên nhân viên</th>
                  <th className="px-4 py-3 text-left font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">Mã phiếu</th>
                  <th className="px-4 py-3 text-center font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">Trạng thái</th>
                  <th className="px-4 py-3 text-center font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">Hoàn thành</th>
                  <th className="px-4 py-3 text-right font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">Tiêu chí</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subordinates.map(sub => {
                  const pct = overallPct(sub.kpiItems);
                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-extrabold text-slate-600 flex-shrink-0">
                            {sub.targetName?.charAt(0)?.toUpperCase() ?? 'U'}
                          </div>
                          <span className="font-bold text-slate-800 truncate max-w-[160px]">{sub.targetName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-semibold">{sub.documentCode}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 text-[9px] font-extrabold uppercase rounded border ${STATUS_CLASS[sub.status] ?? 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                          {STATUS_VI[sub.status] ?? sub.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden min-w-[60px]">
                            <div className={`h-full rounded-full ${pct >= 100 ? 'bg-emerald-500' : pct >= 60 ? 'bg-indigo-500' : 'bg-amber-400'}`} style={{ width: `${pct}%` }}/>
                          </div>
                          <span className="text-[10px] font-bold text-slate-600 w-8 text-right">{pct}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-600">{sub.kpiItems?.length ?? 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty items state */}
      {!doc.kpiItems?.length && subordinates.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center dark:bg-zinc-900 dark:border-zinc-800">
          <AlertTriangle className="w-8 h-8 text-slate-200 dark:text-zinc-700 mx-auto mb-3"/>
          <p className="text-sm font-bold text-slate-400 dark:text-zinc-400">Phiếu này chưa có tiêu chí KPI</p>
          <p className="text-xs text-slate-300 dark:text-zinc-550 mt-1">Chỉnh sửa phiếu để thêm tiêu chí đánh giá</p>
        </div>
      )}
    </div>
  );
}

/* ── helpers ──────────────────────────────────────────────────── */
function overallPct(items?: any[]): number {
  if (!items || items.length === 0) return 0;
  const valid = items.filter(i => i.targetValue > 0);
  if (valid.length === 0) return 0;
  const weighted = valid.reduce((acc: number, i: any) => {
    const pct = Math.min(100, ((i.currentValue ?? 0) / i.targetValue) * 100);
    return acc + pct * (i.weight ?? 1);
  }, 0);
  const totalWeight = valid.reduce((acc: number, i: any) => acc + (i.weight ?? 1), 0);
  return Math.round(weighted / totalWeight);
}

function SummaryTile({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <div className="bg-slate-50 dark:bg-zinc-800/40 rounded-xl p-3.5 flex items-center gap-3 border border-slate-100 dark:border-zinc-800/60">
      <div className="p-2 bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-slate-100 dark:border-zinc-700/50">{icon}</div>
      <div>
        <p className={`text-base font-extrabold ${color}`}>{value}</p>
        <p className="text-[10px] font-semibold text-slate-400 dark:text-zinc-400 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export default KpisCompanyPage;
