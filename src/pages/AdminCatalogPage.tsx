import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// ─── Mock Data ─────────────────────────────────────────────────────────────────
const mockPositions = [
  { id: 1, positionCode: 'POS001', title: 'Nhân viên', level: 1 },
  { id: 2, positionCode: 'POS002', title: 'Trưởng nhóm', level: 2 },
  { id: 3, positionCode: 'POS003', title: 'Trưởng phòng', level: 3 },
  { id: 4, positionCode: 'POS004', title: 'Phó Giám đốc', level: 4 },
  { id: 5, positionCode: 'POS005', title: 'Giám đốc', level: 5 },
];

const mockDepartments = [
  { id: 1, departmentCode: 'DEPT001', name: 'Ban Giám đốc', parentName: null, managerId: 5 },
  { id: 2, departmentCode: 'DEPT002', name: 'Phòng Công nghệ', parentName: 'Ban Giám đốc', managerId: 3 },
  { id: 3, departmentCode: 'DEPT003', name: 'Phòng Kinh doanh', parentName: 'Ban Giám đốc', managerId: 3 },
  { id: 4, departmentCode: 'DEPT004', name: 'Phòng Nhân sự', parentName: 'Ban Giám đốc', managerId: 2 },
  { id: 5, departmentCode: 'DEPT005', name: 'Nhóm Backend', parentName: 'Phòng Công nghệ', managerId: 2 },
];

const mockEmployees = [
  { id: 1, employeeCode: 'EMP001', fullName: 'Nguyễn Hoàng Hải', email: 'hai.nh@kpi-corp.vn', departmentName: 'Ban Giám đốc', positionTitle: 'Giám đốc' },
  { id: 2, employeeCode: 'EMP002', fullName: 'Trần Minh Quang', email: 'quang.tm@kpi-corp.vn', departmentName: 'Phòng Công nghệ', positionTitle: 'Trưởng phòng' },
  { id: 3, employeeCode: 'EMP003', fullName: 'Lê Thu Hương', email: 'huong.lt@kpi-corp.vn', departmentName: 'Phòng Kinh doanh', positionTitle: 'Nhân viên' },
  { id: 4, employeeCode: 'EMP004', fullName: 'Phạm Thế Vinh', email: 'vinh.pt@kpi-corp.vn', departmentName: 'Phòng Nhân sự', positionTitle: 'Trưởng nhóm' },
  { id: 5, employeeCode: 'EMP005', fullName: 'Nguyễn Thu Thảo', email: 'thao.nt@kpi-corp.vn', departmentName: 'Nhóm Backend', positionTitle: 'Nhân viên' },
];

const mockCycles = [
  { id: 1, cycleCode: 'CYCLE-Q1-2025', name: 'Quý 1 năm 2025', type: 'QUARTERLY', startDate: '2025-01-01', endDate: '2025-03-31', status: 'CLOSED' },
  { id: 2, cycleCode: 'CYCLE-Q2-2025', name: 'Quý 2 năm 2025', type: 'QUARTERLY', startDate: '2025-04-01', endDate: '2025-06-30', status: 'EVALUATING' },
  { id: 3, cycleCode: 'CYCLE-Q3-2025', name: 'Quý 3 năm 2025', type: 'QUARTERLY', startDate: '2025-07-01', endDate: '2025-09-30', status: 'ACTIVE' },
  { id: 4, cycleCode: 'CYCLE-Q4-2025', name: 'Quý 4 năm 2025', type: 'QUARTERLY', startDate: '2025-10-01', endDate: '2025-12-31', status: 'PLANNING' },
];

const mockCategories = [
  { id: 1, categoryCode: 'CAT001', name: 'Doanh số & Doanh thu', description: 'Các chỉ tiêu liên quan đến doanh số bán hàng' },
  { id: 2, categoryCode: 'CAT002', name: 'Chất lượng sản phẩm', description: 'Chỉ tiêu về chất lượng và tỷ lệ lỗi' },
  { id: 3, categoryCode: 'CAT003', name: 'Hiệu suất cá nhân', description: 'Năng lực và hiệu suất làm việc' },
  { id: 4, categoryCode: 'CAT004', name: 'Chỉ số khách hàng', description: 'Mức độ hài lòng và giữ chân khách hàng' },
];

const mockTemplates = [
  { id: 1, templateCode: 'TPL001', name: 'Doanh số tháng', categoryName: 'Doanh số & Doanh thu', unit: 'VNĐ', targetType: 'HIGHER_IS_BETTER', defaultWeight: 30, isActive: true },
  { id: 2, templateCode: 'TPL002', name: 'Tỷ lệ lỗi sản phẩm', categoryName: 'Chất lượng sản phẩm', unit: '%', targetType: 'LOWER_IS_BETTER', defaultWeight: 20, isActive: true },
  { id: 3, templateCode: 'TPL003', name: 'Số task hoàn thành', categoryName: 'Hiệu suất cá nhân', unit: 'Task', targetType: 'HIGHER_IS_BETTER', defaultWeight: 25, isActive: true },
  { id: 4, templateCode: 'TPL004', name: 'NPS Score', categoryName: 'Chỉ số khách hàng', unit: 'Điểm', targetType: 'HIGHER_IS_BETTER', defaultWeight: 25, isActive: false },
];

// ─── Sub-components ────────────────────────────────────────────────────────────

const Badge: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = '#6366f1' }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center',
    padding: '2px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 600,
    background: `${color}15`, color, border: `1px solid ${color}30`,
  }}>{children}</span>
);

const statusColor: Record<string, string> = {
  PLANNING: '#94a3b8', ACTIVE: '#10b981', EVALUATING: '#f59e0b', CLOSED: '#6b7280',
};
const statusLabel: Record<string, string> = {
  PLANNING: 'Chuẩn bị', ACTIVE: 'Đang chạy', EVALUATING: 'Đánh giá', CLOSED: 'Đã đóng',
};

interface Column<T> { key: string; label: string; render: (row: T) => React.ReactNode; }

function CatalogTable<T extends { id: number }>({ columns, data }: { columns: Column<T>[]; data: T[] }) {
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
            <tr key={row.id} style={{ background: idx % 2 === 0 ? '#fff' : '#fafbfc', borderBottom: '1px solid #f1f5f9' }}>
              {columns.map(col => (
                <td key={col.key} style={{ padding: '12px 16px', color: '#334155', verticalAlign: 'middle' }}>
                  {col.render(row)}
                </td>
              ))}
              <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                <div style={{ display: 'inline-flex', gap: '6px' }}>
                  <button style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#fff', color: '#6366f1', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>Sửa</button>
                  <button style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid #fee2e2', background: '#fff5f5', color: '#ef4444', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>Xóa</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {data.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '13px' }}>Chưa có dữ liệu</div>
      )}
    </div>
  );
}

// ─── Tabs config ───────────────────────────────────────────────────────────────
const TABS = [
  { id: 'positions', label: 'Chức vụ', icon: '🏅', count: mockPositions.length },
  { id: 'departments', label: 'Phòng ban', icon: '🏢', count: mockDepartments.length },
  { id: 'employees', label: 'Nhân viên', icon: '👥', count: mockEmployees.length },
  { id: 'cycles', label: 'Chu kỳ KPI', icon: '📅', count: mockCycles.length },
  { id: 'categories', label: 'Danh mục', icon: '🗂️', count: mockCategories.length },
  { id: 'templates', label: 'Tiêu chí mẫu', icon: '📋', count: mockTemplates.length },
];

// ─── Main Page ─────────────────────────────────────────────────────────────────
export const AdminCatalogPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('positions');

  const renderTable = () => {
    switch (activeTab) {
      case 'positions':
        return (
          <CatalogTable
            data={mockPositions}
            columns={[
              { key: 'code', label: 'Mã', render: r => <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '12px', color: '#6366f1' }}>{r.positionCode}</code> },
              { key: 'title', label: 'Chức danh', render: r => <span style={{ fontWeight: 600, color: '#1e293b' }}>{r.title}</span> },
              { key: 'level', label: 'Cấp bậc', render: r => <Badge color="#0ea5e9">Cấp {r.level}</Badge> },
            ]}
          />
        );
      case 'departments':
        return (
          <CatalogTable
            data={mockDepartments}
            columns={[
              { key: 'code', label: 'Mã', render: r => <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '12px', color: '#6366f1' }}>{r.departmentCode}</code> },
              { key: 'name', label: 'Tên phòng ban', render: r => <span style={{ fontWeight: 600, color: '#1e293b' }}>{r.name}</span> },
              { key: 'parent', label: 'Phòng ban cha', render: r => r.parentName ? <Badge color="#6366f1">{r.parentName}</Badge> : <span style={{ color: '#cbd5e1' }}>—</span> },
            ]}
          />
        );
      case 'employees':
        return (
          <CatalogTable
            data={mockEmployees}
            columns={[
              { key: 'code', label: 'Mã NV', render: r => <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '12px', color: '#6366f1' }}>{r.employeeCode}</code> },
              { key: 'name', label: 'Họ tên', render: r => <span style={{ fontWeight: 600, color: '#1e293b' }}>{r.fullName}</span> },
              { key: 'email', label: 'Email', render: r => <span style={{ color: '#64748b', fontSize: '12px' }}>{r.email}</span> },
              { key: 'dept', label: 'Phòng ban', render: r => <Badge color="#0ea5e9">{r.departmentName}</Badge> },
              { key: 'pos', label: 'Chức vụ', render: r => <Badge color="#f59e0b">{r.positionTitle}</Badge> },
            ]}
          />
        );
      case 'cycles':
        return (
          <CatalogTable
            data={mockCycles}
            columns={[
              { key: 'code', label: 'Mã', render: r => <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '12px', color: '#6366f1' }}>{r.cycleCode}</code> },
              { key: 'name', label: 'Tên chu kỳ', render: r => <span style={{ fontWeight: 600, color: '#1e293b' }}>{r.name}</span> },
              { key: 'period', label: 'Thời gian', render: r => <span style={{ color: '#64748b', fontSize: '12px' }}>{r.startDate} → {r.endDate}</span> },
              { key: 'status', label: 'Trạng thái', render: r => <Badge color={statusColor[r.status]}>{statusLabel[r.status]}</Badge> },
            ]}
          />
        );
      case 'categories':
        return (
          <CatalogTable
            data={mockCategories}
            columns={[
              { key: 'code', label: 'Mã', render: r => <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '12px', color: '#6366f1' }}>{r.categoryCode}</code> },
              { key: 'name', label: 'Tên danh mục', render: r => <span style={{ fontWeight: 600, color: '#1e293b' }}>{r.name}</span> },
              { key: 'desc', label: 'Mô tả', render: r => <span style={{ color: '#64748b', fontSize: '12px' }}>{r.description}</span> },
            ]}
          />
        );
      case 'templates':
        return (
          <CatalogTable
            data={mockTemplates}
            columns={[
              { key: 'code', label: 'Mã', render: r => <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '12px', color: '#6366f1' }}>{r.templateCode}</code> },
              { key: 'name', label: 'Tên tiêu chí', render: r => <span style={{ fontWeight: 600, color: '#1e293b' }}>{r.name}</span> },
              { key: 'category', label: 'Danh mục', render: r => <Badge color="#6366f1">{r.categoryName}</Badge> },
              { key: 'unit', label: 'Đơn vị', render: r => <span style={{ color: '#64748b' }}>{r.unit}</span> },
              { key: 'weight', label: 'Trọng số', render: r => <span style={{ fontWeight: 600 }}>{r.defaultWeight}%</span> },
              { key: 'active', label: 'Trạng thái', render: r => <Badge color={r.isActive ? '#10b981' : '#94a3b8'}>{r.isActive ? 'Hoạt động' : 'Tắt'}</Badge> },
            ]}
          />
        );
      default:
        return null;
    }
  };

  const currentTab = TABS.find(t => t.id === activeTab)!;

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1, #0ea5e9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
            }}>🗄️</div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Quản lý Danh mục</h1>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0, paddingLeft: '46px' }}>
            Quản lý các danh mục nền tảng của hệ thống KPI
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/catalog/new')}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 20px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366f1, #0ea5e9)',
            color: '#fff', border: 'none', fontSize: '13px', fontWeight: 600,
            cursor: 'pointer', boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
          }}
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
          Thêm mới
        </button>
      </div>

      {/* Summary stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '16px', borderRadius: '12px', textAlign: 'left',
              background: activeTab === tab.id ? 'linear-gradient(135deg, #6366f115, #0ea5e915)' : '#fff',
              border: `1.5px solid ${activeTab === tab.id ? '#6366f140' : '#e2e8f0'}`,
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            <div style={{ fontSize: '20px', marginBottom: '6px' }}>{tab.icon}</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: activeTab === tab.id ? '#6366f1' : '#1e293b' }}>{tab.count}</div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px', fontWeight: 500 }}>{tab.label}</div>
          </button>
        ))}
      </div>

      {/* Table card */}
      <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
        {/* Tab bar */}
        <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', padding: '0 16px', overflowX: 'auto', gap: '4px' }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '14px 16px', border: 'none', background: 'none',
                fontSize: '13px', fontWeight: activeTab === tab.id ? 700 : 500,
                color: activeTab === tab.id ? '#6366f1' : '#94a3b8',
                borderBottom: `2px solid ${activeTab === tab.id ? '#6366f1' : 'transparent'}`,
                cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}
            >
              <span>{tab.icon}</span>
              {tab.label}
              <span style={{
                padding: '1px 7px', borderRadius: '100px', fontSize: '10px', fontWeight: 700,
                background: activeTab === tab.id ? '#6366f115' : '#f1f5f9',
                color: activeTab === tab.id ? '#6366f1' : '#94a3b8',
              }}>{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Table toolbar */}
        <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <svg style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              placeholder={`Tìm kiếm ${currentTab.label.toLowerCase()}...`}
              style={{
                padding: '8px 12px 8px 34px', borderRadius: '8px',
                border: '1px solid #e2e8f0', fontSize: '13px', color: '#334155',
                outline: 'none', width: '240px', background: '#f8fafc',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
              Tổng: <strong style={{ color: '#334155' }}>{currentTab.count}</strong> bản ghi
            </span>
            <button style={{ padding: '7px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Xuất CSV
            </button>
          </div>
        </div>

        {/* Table content */}
        {renderTable()}

        {/* Pagination */}
        <div style={{ padding: '14px 16px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '6px' }}>
          {[1, 2, 3].map(p => (
            <button key={p} style={{
              width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #e2e8f0',
              background: p === 1 ? '#6366f1' : '#fff', color: p === 1 ? '#fff' : '#64748b',
              fontSize: '12px', fontWeight: 600, cursor: 'pointer',
            }}>{p}</button>
          ))}
        </div>
      </div>
    </div>
  );
};
