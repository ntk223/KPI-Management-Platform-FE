import {
  Target, Building2, User, FileText,
  ChevronDown, ChevronRight, Pencil
} from 'lucide-react';

/* ─── Status helpers (shared across kpi-document components) ─── */

export const STATUS_VI: Record<string, string> = {
  DRAFT:            'Nháp',
  PENDING_APPROVAL: 'Chờ duyệt',
  APPROVED:         'Đã duyệt',
  REJECTED:         'Từ chối',
  IN_PROGRESS:      'Đang thực hiện',
  CLOSED:           'Đã đóng',
};

export const STATUS_CLASS: Record<string, string> = {
  DRAFT:            'bg-slate-100  text-slate-600  border-slate-200',
  PENDING_APPROVAL: 'bg-amber-50   text-amber-700  border-amber-200',
  APPROVED:         'bg-emerald-50 text-emerald-700 border-emerald-200',
  REJECTED:         'bg-rose-50    text-rose-700    border-rose-200',
  IN_PROGRESS:      'bg-indigo-50  text-indigo-700  border-indigo-200',
  CLOSED:           'bg-slate-200  text-slate-600  border-slate-300',
};

/* ─── DocRow ─────────────────────────────────────────────────── */

interface DocRowProps {
  doc: any;
  depth?: number;
  hasChildren?: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
  isItemsExpanded: boolean;
  onToggleItems: () => void;
  onEdit: () => void;
}

export function DocRow({
  doc, depth = 0,
  hasChildren = false, isExpanded = false, onToggle,
  isItemsExpanded, onToggleItems, onEdit,
}: DocRowProps) {
  const indentClass = ['pl-4', 'pl-10', 'pl-16'][depth] ?? 'pl-4';

  const typeConfig = {
    COMPANY:    { Icon: Target,    iconColor: 'text-indigo-600', label: 'Công ty',   rowBg: 'hover:bg-indigo-50/30' },
    DEPARTMENT: { Icon: Building2, iconColor: 'text-sky-600',    label: 'Phòng ban', rowBg: 'hover:bg-sky-50/30'    },
    EMPLOYEE:   { Icon: User,      iconColor: 'text-slate-500',  label: 'Nhân viên', rowBg: 'hover:bg-slate-50'      },
  }[doc.targetType as string] ?? { Icon: FileText, iconColor: 'text-slate-400', label: '—', rowBg: '' };

  const { Icon, iconColor, label: typeLabel, rowBg } = typeConfig;

  return (
    <div className="divide-y divide-slate-100/70">
      <div className={`flex items-center gap-2 px-4 py-3 transition-colors ${indentClass} ${rowBg}`}>

        {/* Expand children */}
        <div className="w-5 flex-shrink-0">
          {hasChildren ? (
            <button
              onClick={onToggle}
              className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-200 text-slate-400 transition-colors"
            >
              {isExpanded ? <ChevronDown className="w-3.5 h-3.5"/> : <ChevronRight className="w-3.5 h-3.5"/>}
            </button>
          ) : <div className="w-5"/>}
        </div>

        {/* Type icon */}
        <Icon className={`w-4 h-4 flex-shrink-0 ${iconColor}`}/>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-extrabold text-slate-800 truncate">{doc.targetName}</span>
            <span className="text-[9px] font-semibold text-slate-400 truncate hidden sm:inline">{doc.documentCode}</span>
            <span className={`inline-flex px-1.5 py-0.5 text-[8px] font-extrabold uppercase rounded border ${STATUS_CLASS[doc.status] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
              {STATUS_VI[doc.status] ?? doc.status}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className={`text-[10px] font-bold ${iconColor}`}>{typeLabel}</span>
            {doc.kpiItems?.length > 0 && (
              <span className="text-[10px] text-slate-400 font-semibold">{doc.kpiItems.length} tiêu chí</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {doc.status === 'DRAFT' && (
            <button
              onClick={e => { e.stopPropagation(); onEdit(); }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              title="Chỉnh sửa"
            >
              <Pencil className="w-3.5 h-3.5"/>
            </button>
          )}
          <button
            onClick={onToggleItems}
            className={`p-1.5 rounded-lg transition-colors ${isItemsExpanded ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
            title="Xem tiêu chí KPI"
          >
            {isItemsExpanded ? <ChevronDown className="w-3.5 h-3.5"/> : <ChevronRight className="w-3.5 h-3.5"/>}
          </button>
        </div>
      </div>

      {/* Items drawer */}
      {isItemsExpanded && <ItemsDrawer items={doc.kpiItems}/>}
    </div>
  );
}

/* ─── ItemsDrawer ────────────────────────────────────────────── */

export function ItemsDrawer({ items }: { items?: any[] }) {
  return (
    <div className="bg-gradient-to-br from-slate-50 to-indigo-50/20 px-6 py-4 animate-[fadeIn_0.12s_ease-out]">
      {!items || items.length === 0 ? (
        <p className="text-xs text-slate-400 italic text-center py-4">Phiếu này chưa có tiêu chí KPI nào.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {items.map((item: any) => {
            const pct = item.progress !== undefined && item.progress !== null
              ? Math.min(100, Math.round(item.progress))
              : (item.targetValue > 0
                ? Math.min(100, Math.round((item.currentValue ?? 0) / item.targetValue * 100))
                : 0);
            return (
              <div key={item.id} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-800 leading-snug">{item.name}</p>
                    <span className={`inline-block px-1.5 py-0.2 text-[8px] font-extrabold uppercase rounded-lg border ${
                      item.itemType === 'GROUP' ? 'bg-amber-50 text-amber-705 border-amber-250' :
                      item.itemType === 'NUMERIC' ? 'bg-sky-50 text-sky-700 border-sky-200' :
                      'bg-indigo-50 text-indigo-700 border-indigo-200'
                    }`}>
                      {item.itemType === 'GROUP' ? 'Nhóm (GROUP)' : (item.itemType === 'NUMERIC' ? 'Số lượng' : 'Tỷ lệ %')}
                    </span>
                  </div>
                  <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded-lg whitespace-nowrap">
                    {item.weight ? (item.weight <= 1 ? Math.round(item.weight * 100) : item.weight) : 0}%
                  </span>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] font-semibold text-slate-500 mb-1">
                    {item.itemType === 'GROUP' ? (
                      <span>Tiến độ nhóm (tự tính)</span>
                    ) : (
                      <span>{item.currentValue ?? 0} / {item.targetValue} {item.unit}</span>
                    )}
                    <span className="text-indigo-650 font-bold">{pct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
