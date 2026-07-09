import React from 'react';
import { Target, Building, User, Pencil, ChevronDown, ChevronRight } from 'lucide-react';

interface KpiCascadingTreeRowProps {
  doc: any;
  depth: number;
  hasChildren?: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
  isItemsExpanded: boolean;
  onToggleItems: () => void;
  onEdit?: () => void;
}

const STATUS_VI: Record<string, string> = {
  DRAFT:            'Nháp',
  PENDING_APPROVAL: 'Chờ duyệt',
  APPROVED:         'Đã duyệt',
  REJECTED:         'Từ chối',
  IN_PROGRESS:      'Đang thực hiện',
  EVALUATING:       'Đang đánh giá',
  CLOSED:           'Đã đóng',
};

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'DRAFT': return 'bg-slate-100 text-slate-700 border-slate-200';
    case 'PENDING_APPROVAL': return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'APPROVED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'REJECTED': return 'bg-rose-100 text-rose-700 border-rose-200';
    case 'IN_PROGRESS': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    case 'EVALUATING': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'CLOSED': return 'bg-slate-900 text-white border-slate-800';
    default: return 'bg-blue-100 text-blue-700 border-blue-200';
  }
};

export const KpiCascadingTreeRow: React.FC<KpiCascadingTreeRowProps> = ({
  doc,
  depth,
  hasChildren = false,
  isExpanded = false,
  onToggle,
  isItemsExpanded,
  onToggleItems,
  onEdit
}) => {
  const indentStyles = [
    'pl-4',
    'pl-10 bg-slate-50/20 dark:bg-zinc-900/10',
    'pl-16 bg-white dark:bg-zinc-900'
  ];

  const targetLabel = doc.targetType === 'COMPANY' ? 'TẬP ĐOÀN' : (doc.targetType === 'DEPARTMENT' ? 'PHÒNG BAN' : 'NHÂN VIÊN');
  const targetBadgeClass = doc.targetType === 'COMPANY' 
    ? 'bg-indigo-600 text-white' 
    : (doc.targetType === 'DEPARTMENT' 
      ? 'bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/60' 
      : 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700');

  return (
    <div className="divide-y divide-slate-100 dark:divide-zinc-800">
      <div className={`p-4 grid grid-cols-12 items-center hover:bg-slate-50/80 dark:hover:bg-zinc-850/40 transition-colors ${indentStyles[depth] || 'pl-4'}`}>
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
            {STATUS_VI[doc.status] || doc.status}
          </span>
        </div>

        {/* Actions */}
        <div className="col-span-1 text-right flex items-center justify-end gap-1.5">
          {onEdit && (doc.status === 'DRAFT' || doc.status === 'REJECTED') && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="text-slate-500 hover:text-indigo-600 p-1 hover:bg-slate-100 rounded-lg transition-colors"
              title="Chỉnh sửa phiếu KPI này"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={onToggleItems}
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
};
