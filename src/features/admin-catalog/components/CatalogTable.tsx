import React from 'react';
import {
  PositionItem,
  DepartmentItem,
  EmployeeItem,
  CycleItem,
  CategoryItem,
  TemplateItem,
  AccountItem,
  CatalogItem
} from '../types';

// ─── Highlight helper ────────────────────────────────────────────────────────────

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-150 dark:bg-yellow-950/70 text-yellow-800 dark:text-yellow-255 rounded-sm px-0.5">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

// ─── Badge ──────────────────────────────────────────────────────────────────────

type BadgeColorType = 'primary' | 'info' | 'success' | 'warning' | 'danger' | 'neutral';

const Badge: React.FC<{ children: React.ReactNode; colorType?: BadgeColorType }> = ({
  children,
  colorType = 'primary'
}) => {
  const styles: Record<BadgeColorType, string> = {
    primary: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900/60',
    info: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900/60',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60',
    warning: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60',
    danger: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/60',
    neutral: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${styles[colorType]}`}>
      {children}
    </span>
  );
};

const cycleStatusColorType: Record<string, BadgeColorType> = {
  PLANNING: 'neutral',
  ACTIVE: 'success',
  EVALUATING: 'warning',
  CLOSED: 'danger'
};
const cycleStatusLabel: Record<string, string> = {
  PLANNING: 'Chuẩn bị',
  ACTIVE: 'Đang chạy',
  EVALUATING: 'Đánh giá',
  CLOSED: 'Đã đóng'
};

const accountStatusColorType: Record<string, BadgeColorType> = {
  ACTIVE: 'success',
  INACTIVE: 'neutral',
  LOCKED: 'danger'
};
const accountStatusLabel: Record<string, string> = {
  ACTIVE: 'Hoạt động',
  INACTIVE: 'Không hoạt động',
  LOCKED: 'Đã khoá'
};

const roleColorType: Record<string, BadgeColorType> = {
  ADMIN: 'primary',
  DIRECTOR: 'info',
  MANAGER: 'warning',
  EMPLOYEE: 'success'
};

interface Column<T> { key: string; label: string; render: (row: T) => React.ReactNode; }

interface GenericTableProps<T extends { id: number }> {
  columns: Column<T>[];
  data: T[];
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
}

function GenericTable<T extends { id: number }>({ columns, data, onEdit, onDelete }: GenericTableProps<T>) {
  return (
    <div className="overflow-x-auto w-full">
      <table className="w-full border-collapse text-[13px] text-slate-600 dark:text-zinc-300">
        <thead>
          <tr className="bg-slate-50 dark:bg-zinc-800/60 border-b border-slate-200 dark:border-zinc-800">
            {columns.map(col => (
              <th
                key={col.key}
                className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider whitespace-nowrap"
              >
                {col.label}
              </th>
            ))}
            <th className="px-4 py-3 text-right text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
              Thao tác
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-150 dark:divide-zinc-800/60 bg-white dark:bg-zinc-900">
          {data.map((row) => (
            <tr
              key={row.id}
              className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/40 transition-colors"
            >
              {columns.map(col => (
                <td key={col.key} className="px-4 py-3 text-slate-700 dark:text-zinc-200 align-middle">
                  {col.render(row)}
                </td>
              ))}
              <td className="px-4 py-3 text-right whitespace-nowrap align-middle">
                <div className="inline-flex gap-1.5">
                  <button
                    onClick={() => onEdit?.(row)}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 text-indigo-600 dark:text-indigo-400 text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => onDelete?.(row)}
                    className="px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-950/60 bg-rose-50/50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400 text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                  >
                    Xóa
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {data.length === 0 && (
        <div className="text-center py-10 text-slate-400 dark:text-zinc-500 text-xs">
          <svg
            className="w-10 h-10 mx-auto mb-2 opacity-30 text-slate-400 dark:text-zinc-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Không tìm thấy kết quả phù hợp
        </div>
      )}
    </div>
  );
}

interface CatalogTableProps {
  activeTab: string;
  data: CatalogItem[];
  debouncedQuery: string;
  onEdit: (row: CatalogItem) => void;
  onDelete: (row: CatalogItem) => void;
  onToggleTemplateActive: (id: number, currentActive: boolean) => void;
  onCycleStatusChange: (id: number, nextStatus: string) => void;
}

export const CatalogTable: React.FC<CatalogTableProps> = ({
  activeTab,
  data,
  debouncedQuery,
  onEdit,
  onDelete,
  onToggleTemplateActive,
  onCycleStatusChange
}) => {
  const codeCell = (code: string) => (
    <code className="bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-xs font-semibold font-mono text-indigo-600 dark:text-indigo-400 border border-slate-200/60 dark:border-zinc-700">
      <Highlight text={code} query={debouncedQuery} />
    </code>
  );

  const nameCell = (name: string) => (
    <span className="font-semibold text-slate-900 dark:text-zinc-100">
      <Highlight text={name} query={debouncedQuery} />
    </span>
  );

  const subtleCell = (text: string) => (
    <span className="text-slate-500 dark:text-zinc-400 text-xs">
      <Highlight text={text} query={debouncedQuery} />
    </span>
  );

  switch (activeTab) {
    case 'positions':
      return (
        <GenericTable<PositionItem>
          data={data as PositionItem[]}
          onEdit={onEdit}
          onDelete={onDelete}
          columns={[
            { key: 'code',  label: 'Mã',       render: r => codeCell(r.positionCode) },
            { key: 'title', label: 'Chức danh', render: r => nameCell(r.title) },
            { key: 'level', label: 'Cấp bậc',  render: r => <Badge colorType="info">Cấp {r.level}</Badge> },
          ]}
        />
      );
    case 'departments':
      return (
        <GenericTable<DepartmentItem>
          data={data as DepartmentItem[]}
          onEdit={onEdit}
          onDelete={onDelete}
          columns={[
            { key: 'code',   label: 'Mã',           render: r => codeCell(r.departmentCode) },
            { key: 'name',   label: 'Tên phòng ban', render: r => nameCell(r.name) },
            { key: 'parent', label: 'Phòng ban cha', render: r => r.parentName ? <Badge colorType="primary">{r.parentName}</Badge> : <span className="text-slate-300 dark:text-zinc-650">—</span> },
          ]}
        />
      );
    case 'employees':
      return (
        <GenericTable<EmployeeItem>
          data={data as EmployeeItem[]}
          onEdit={onEdit}
          onDelete={onDelete}
          columns={[
            { key: 'code',  label: 'Mã NV',   render: r => codeCell(r.employeeCode) },
            { key: 'name',  label: 'Họ tên',   render: r => nameCell(r.fullName) },
            { key: 'email', label: 'Email',    render: r => subtleCell(r.email) },
            { key: 'dept',  label: 'Phòng ban', render: r => r.departmentName ? <Badge colorType="info">{r.departmentName}</Badge> : <span className="text-slate-300 dark:text-zinc-650">—</span> },
            { key: 'pos',   label: 'Chức vụ',  render: r => r.positionTitle ? <Badge colorType="warning">{r.positionTitle}</Badge> : <span className="text-slate-300 dark:text-zinc-650">—</span> },
          ]}
        />
      );
    case 'cycles':
      return (
        <GenericTable<CycleItem>
          data={data as CycleItem[]}
          onEdit={onEdit}
          onDelete={onDelete}
          columns={[
            { key: 'code',   label: 'Mã',        render: r => codeCell(r.cycleCode) },
            { key: 'name',   label: 'Tên chu kỳ', render: r => nameCell(r.name) },
            { key: 'period', label: 'Thời gian',  render: r => subtleCell(`${r.startDate} → ${r.endDate}`) },
            { key: 'status', label: 'Trạng thái', render: r => {
                const nextStatusMap: Record<string, string> = { PLANNING: 'ACTIVE', ACTIVE: 'EVALUATING', EVALUATING: 'CLOSED' };
                const nextStatus = nextStatusMap[r.status];
                const nextLabelMap: Record<string, string> = { ACTIVE: 'Chạy', EVALUATING: 'Đánh giá', CLOSED: 'Đóng' };
                return (
                  <div className="flex items-center gap-2">
                    <Badge colorType={cycleStatusColorType[r.status] ?? 'neutral'}>{cycleStatusLabel[r.status] ?? r.status}</Badge>
                    {nextStatus && (
                      <button
                        onClick={() => onCycleStatusChange(r.id, nextStatus)}
                        className="px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold cursor-pointer inline-flex items-center gap-0.5"
                      >
                        ➔ {nextLabelMap[nextStatus]}
                      </button>
                    )}
                  </div>
                );
            }},
          ]}
        />
      );
    case 'categories':
      return (
        <GenericTable<CategoryItem>
          data={data as CategoryItem[]}
          onEdit={onEdit}
          onDelete={onDelete}
          columns={[
            { key: 'code', label: 'Mã',          render: r => codeCell(r.categoryCode) },
            { key: 'name', label: 'Tên danh mục', render: r => nameCell(r.name) },
            { key: 'desc', label: 'Mô tả',        render: r => subtleCell(r.description ?? '—') },
          ]}
        />
      );
    case 'templates':
      return (
        <GenericTable<TemplateItem>
          data={data as TemplateItem[]}
          onEdit={onEdit}
          onDelete={onDelete}
          columns={[
            { key: 'code',     label: 'Mã',          render: r => codeCell(r.templateCode) },
            { key: 'name',     label: 'Tên tiêu chí', render: r => nameCell(r.name) },
            { key: 'category', label: 'Danh mục',     render: r => r.categoryName ? <Badge colorType="primary">{r.categoryName}</Badge> : <span className="text-slate-300 dark:text-zinc-650">—</span> },
            { key: 'unit',     label: 'Đơn vị',       render: r => subtleCell(r.unit ?? '—') },
            { key: 'itemType', label: 'Loại',         render: r => {
              const type = r.itemType || 'PERCENTAGE';
              const label = type === 'PERCENTAGE' ? 'Tỷ lệ (%)' : (type === 'NUMERIC' ? 'Số lượng' : 'Nhóm (GROUP)');
              return <Badge colorType={type === 'GROUP' ? 'warning' : 'info'}>{label}</Badge>;
            }},
            { key: 'weight',   label: 'Trọng số',     render: r => <span className="font-semibold">{r.defaultWeight ? (r.defaultWeight <= 1 ? Math.round(r.defaultWeight * 100) : r.defaultWeight) : 0}%</span> },
            { key: 'active',   label: 'Trạng thái',   render: r => (
                <div className="flex items-center gap-2">
                  <Badge colorType={r.isActive ? 'success' : 'neutral'}>{r.isActive ? 'Hoạt động' : 'Tắt'}</Badge>
                  <button
                    onClick={() => onToggleTemplateActive(r.id, !!r.isActive)}
                    className="px-2 py-0.5 rounded border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-350 text-[10px] font-bold cursor-pointer"
                  >
                    Đổi
                  </button>
                </div>
            )},
          ]}
        />
      );
    case 'accounts':
      return (
        <GenericTable<AccountItem>
          data={data as AccountItem[]}
          onEdit={onEdit}
          onDelete={onDelete}
          columns={[
            { key: 'username', label: 'Tên đăng nhập', render: r => nameCell(r.username) },
            { key: 'fullName', label: 'Nhân viên',      render: r => r.fullName ? <span className="text-xs text-slate-800 dark:text-zinc-200"><Highlight text={r.fullName} query={debouncedQuery} /></span> : <span className="text-slate-300 dark:text-zinc-650">—</span> },
            { key: 'email',    label: 'Email',           render: r => r.email ? subtleCell(r.email) : <span className="text-slate-300 dark:text-zinc-650">—</span> },
            { key: 'roles',    label: 'Vai trò',         render: r => (
              <div className="flex gap-1 flex-wrap">
                {(r.roles ?? []).map(role => <Badge key={role} colorType={roleColorType[role] ?? 'neutral'}>{role}</Badge>)}
                {(!r.roles || r.roles.length === 0) && <span className="text-slate-300 dark:text-zinc-650">—</span>}
              </div>
            )},
            { key: 'provider', label: 'Provider',        render: r => subtleCell(r.provider ?? 'LOCAL') },
            { key: 'status',   label: 'Trạng thái',      render: r => <Badge colorType={accountStatusColorType[r.status] ?? 'neutral'}>{accountStatusLabel[r.status] ?? r.status}</Badge> },
          ]}
        />
      );
    default: return null;
  }
};
