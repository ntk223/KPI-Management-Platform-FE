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
      <mark style={{ background: '#fef08a', color: '#713f12', borderRadius: '2px', padding: '0 1px' }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

// ─── Badge ──────────────────────────────────────────────────────────────────────

const Badge: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = '#6366f1' }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', padding: '2px 10px',
    borderRadius: '100px', fontSize: '11px', fontWeight: 600,
    background: `${color}15`, color, border: `1px solid ${color}30`,
  }}>{children}</span>
);

const statusColor: Record<string, string> = { PLANNING: '#94a3b8', ACTIVE: '#10b981', EVALUATING: '#f59e0b', CLOSED: '#6b7280' };
const statusLabel: Record<string, string> = { PLANNING: 'Chuẩn bị', ACTIVE: 'Đang chạy', EVALUATING: 'Đánh giá', CLOSED: 'Đã đóng' };
const accountStatusColor: Record<string, string> = { ACTIVE: '#10b981', INACTIVE: '#94a3b8', LOCKED: '#ef4444' };
const accountStatusLabel: Record<string, string> = { ACTIVE: 'Hoạt động', INACTIVE: 'Không hoạt động', LOCKED: 'Đã khoá' };
const roleColor: Record<string, string> = { ADMIN: '#6366f1', DIRECTOR: '#0ea5e9', MANAGER: '#f59e0b', EMPLOYEE: '#10b981' };

interface Column<T> { key: string; label: string; render: (row: T) => React.ReactNode; }

interface GenericTableProps<T extends { id: number }> {
  columns: Column<T>[];
  data: T[];
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
}

function GenericTable<T extends { id: number }>({ columns, data, onEdit, onDelete }: GenericTableProps<T>) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        <thead>
          <tr style={{ background: '#f8fafc' }}>
            {columns.map(col => (
              <th key={col.key} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                {col.label}
              </th>
            ))}
            <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: '11px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={row.id} style={{ background: idx % 2 === 0 ? '#fff' : '#fafbfc', borderBottom: '1px solid #f1f5f9', transition: 'background 0.1s' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f0f9ff')}
              onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 0 ? '#fff' : '#fafbfc')}
            >
              {columns.map(col => (
                <td key={col.key} style={{ padding: '12px 16px', color: '#334155', verticalAlign: 'middle' }}>
                  {col.render(row)}
                </td>
              ))}
              <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                <div style={{ display: 'inline-flex', gap: '6px' }}>
                  <button onClick={() => onEdit?.(row)} style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#fff', color: '#6366f1', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>Sửa</button>
                  <button onClick={() => onDelete?.(row)} style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid #fee2e2', background: '#fff5f5', color: '#ef4444', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>Xóa</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {data.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '13px' }}>
          <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ display: 'block', margin: '0 auto 8px', opacity: 0.3 }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
    <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '12px', color: '#6366f1' }}>
      <Highlight text={code} query={debouncedQuery} />
    </code>
  );

  const nameCell = (name: string) => (
    <span style={{ fontWeight: 600, color: '#1e293b' }}>
      <Highlight text={name} query={debouncedQuery} />
    </span>
  );

  const subtleCell = (text: string) => (
    <span style={{ color: '#64748b', fontSize: '12px' }}>
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
            { key: 'level', label: 'Cấp bậc',  render: r => <Badge color="#0ea5e9">Cấp {r.level}</Badge> },
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
            { key: 'parent', label: 'Phòng ban cha', render: r => r.parentName ? <Badge color="#6366f1">{r.parentName}</Badge> : <span style={{ color: '#cbd5e1' }}>—</span> },
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
            { key: 'dept',  label: 'Phòng ban', render: r => r.departmentName ? <Badge color="#0ea5e9">{r.departmentName}</Badge> : <span style={{ color: '#cbd5e1' }}>—</span> },
            { key: 'pos',   label: 'Chức vụ',  render: r => r.positionTitle ? <Badge color="#f59e0b">{r.positionTitle}</Badge> : <span style={{ color: '#cbd5e1' }}>—</span> },
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Badge color={statusColor[r.status] ?? '#94a3b8'}>{statusLabel[r.status] ?? r.status}</Badge>
                    {nextStatus && (
                      <button onClick={() => onCycleStatusChange(r.id, nextStatus)} style={{ padding: '2px 8px', borderRadius: '4px', border: '1px solid #6366f1', background: '#f5f3ff', color: '#6366f1', fontSize: '10px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
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
            { key: 'category', label: 'Danh mục',     render: r => r.categoryName ? <Badge color="#6366f1">{r.categoryName}</Badge> : <span style={{ color: '#cbd5e1' }}>—</span> },
            { key: 'unit',     label: 'Đơn vị',       render: r => subtleCell(r.unit ?? '—') },
            { key: 'weight',   label: 'Trọng số',     render: r => <span style={{ fontWeight: 600 }}>{r.defaultWeight ?? 0}%</span> },
            { key: 'active',   label: 'Trạng thái',   render: r => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Badge color={r.isActive ? '#10b981' : '#94a3b8'}>{r.isActive ? 'Hoạt động' : 'Tắt'}</Badge>
                  <button onClick={() => onToggleTemplateActive(r.id, !!r.isActive)} style={{ padding: '2px 8px', borderRadius: '4px', border: '1px solid #64748b', background: '#f8fafc', color: '#64748b', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}>
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
            { key: 'fullName', label: 'Nhân viên',      render: r => r.fullName ? <span style={{ fontSize: '12px', color: '#334155' }}><Highlight text={r.fullName} query={debouncedQuery} /></span> : <span style={{ color: '#cbd5e1' }}>—</span> },
            { key: 'email',    label: 'Email',           render: r => r.email ? subtleCell(r.email) : <span style={{ color: '#cbd5e1' }}>—</span> },
            { key: 'roles',    label: 'Vai trò',         render: r => (
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {(r.roles ?? []).map(role => <Badge key={role} color={roleColor[role] ?? '#94a3b8'}>{role}</Badge>)}
                {(!r.roles || r.roles.length === 0) && <span style={{ color: '#cbd5e1' }}>—</span>}
              </div>
            )},
            { key: 'provider', label: 'Provider',        render: r => subtleCell(r.provider ?? 'LOCAL') },
            { key: 'status',   label: 'Trạng thái',      render: r => <Badge color={accountStatusColor[r.status] ?? '#94a3b8'}>{accountStatusLabel[r.status] ?? r.status}</Badge> },
          ]}
        />
      );
    default: return null;
  }
};
