import React from 'react';
import { useSearchParams } from 'react-router-dom';
import * as Icon from '../components/icons';
import {
  useCatalog,
  CatalogTable,
  CatalogFormModal,
  DeleteConfirmModal,
  ToastNotification,
  TAB_FILTERS,
  FilterDef
} from '../features/admin-catalog';

const TABS = [
  { id: 'positions',   label: 'Chức vụ',      icon: 'Medal',         color: '#0ea5e9' },
  { id: 'departments', label: 'Phòng ban',     icon: 'Building',      color: '#6366f1' },
  { id: 'employees',   label: 'Nhân viên',     icon: 'Users',         color: '#10b981' },
  { id: 'cycles',      label: 'Chu kỳ KPI',   icon: 'Calendar',      color: '#f59e0b' },
  { id: 'categories',  label: 'Danh mục',      icon: 'FolderOpen',    color: '#8b5cf6' },
  { id: 'templates',   label: 'Tiêu chí mẫu', icon: 'ClipboardList', color: '#ec4899' },
  { id: 'accounts',    label: 'Tài khoản',     icon: 'User',          color: '#64748b' },
];

function FilterSelect({ filterDef, value, onChange }: {
  filterDef: FilterDef; value: string; onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>
        {filterDef.label}:
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          padding: '6px 28px 6px 10px', borderRadius: '7px', border: '1px solid #e2e8f0',
          fontSize: '12px', color: value ? '#334155' : '#94a3b8', background: value ? '#f0f9ff' : '#f8fafc',
          outline: 'none', cursor: 'pointer', fontWeight: value ? 600 : 400,
          appearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center',
        }}
      >
        <option value="">Tất cả</option>
        {filterDef.options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

export const AdminCatalogPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'positions';

  const {
    searchQuery,
    setSearchQuery,
    debouncedQuery,
    filterValues,
    pageData,
    isLoading,
    error,
    tabCounts,
    isFormOpen,
    setIsFormOpen,
    editingItem,
    formValues,
    setFormValues,
    itemToDelete,
    setItemToDelete,
    departmentsList,
    positionsList,
    employeesList,
    categoriesList,
    isFetchingOptions,
    toasts,
    openForm,
    handleFormSubmit,
    handleDeleteConfirm,
    handleToggleTemplateActive,
    handleCycleStatusChange,
    handlePageChange,
    handleFilterChange,
    handleClearFilters,
    fetchPage,
    currentPage
  } = useCatalog(activeTab);

  const searchRef = React.useRef<HTMLInputElement>(null);

  const currentTab = TABS.find(t => t.id === activeTab) || TABS[0];
  const totalCount = tabCounts[activeTab] ?? 0;
  const tabFilters = TAB_FILTERS[activeTab] ?? [];

  const hasActiveClientFilter = Object.values(filterValues).some(Boolean);
  const hasActiveFilter = debouncedQuery.trim() || hasActiveClientFilter;
  const activeFilterCount = (debouncedQuery.trim() ? 1 : 0) + Object.values(filterValues).filter(Boolean).length;

  const filteredData = React.useMemo(() => {
    let data = (pageData?.content ?? []);
    tabFilters.forEach(fd => {
      const val = filterValues[fd.key];
      if (val) data = data.filter(item => fd.test(item, val));
    });
    return data;
  }, [pageData, filterValues, tabFilters]);



  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Toast Notifications */}
      <ToastNotification toasts={toasts} />

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1, #0ea5e9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              {(() => { const IC = Icon[currentTab.icon as keyof typeof Icon]; return IC ? <IC style={{ width: '20px', height: '20px' }} /> : <Icon.Database style={{ width: '20px', height: '20px' }} />; })()}
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Quản lý {currentTab.label}</h1>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0, paddingLeft: '46px' }}>
            Quản lý danh sách {currentTab.label.toLowerCase()} của hệ thống KPI
          </p>
        </div>
        <button onClick={() => openForm(null)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1, #0ea5e9)', color: '#fff', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
          Thêm {currentTab.label.toLowerCase()} mới
        </button>
      </div>

      {/* Table card */}
      <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>

        {/* ── Search & Filter toolbar ── */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '10px' }}>

          {/* Row 1: search input + action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>

            {/* Search input */}
            <div style={{ position: 'relative', flex: '1', minWidth: '200px', maxWidth: '360px' }}>
              <svg style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={searchRef}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={`Tìm kiếm ${currentTab.label.toLowerCase()}...`}
                style={{ width: '100%', padding: '8px 36px 8px 34px', borderRadius: '8px', border: `1px solid ${debouncedQuery ? '#6366f1' : '#e2e8f0'}`, fontSize: '13px', color: '#334155', outline: 'none', background: debouncedQuery ? '#f5f3ff' : '#f8fafc', boxSizing: 'border-box', transition: 'border 0.15s, background 0.15s' }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px', display: 'flex' }}>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>

            {/* Right actions */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
              {isLoading && (
                <span style={{ fontSize: '12px', color: '#6366f1', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <svg style={{ animation: 'spin 1s linear infinite' }} width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  Đang tải...
                </span>
              )}

              {/* Result count badge */}
              {hasActiveFilter ? (
                <span style={{ fontSize: '12px', color: '#6366f1', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '6px', padding: '4px 10px', fontWeight: 600 }}>
                  {filteredData.length} / {pageData?.content.length ?? 0} kết quả trang
                </span>
              ) : (
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                  Tổng: <strong style={{ color: '#334155' }}>{totalCount}</strong> bản ghi
                </span>
              )}

              <button onClick={() => fetchPage(activeTab, currentPage, debouncedQuery)} style={{ padding: '7px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                Làm mới
              </button>
            </div>
          </div>

          {/* Row 2: Filter chips */}
          {tabFilters.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                BỘ LỌC
              </span>
              {tabFilters.map(fd => (
                <FilterSelect key={fd.key} filterDef={fd} value={filterValues[fd.key] ?? ''} onChange={v => handleFilterChange(fd.key, v)} />
              ))}
              {hasActiveFilter && (
                <button onClick={handleClearFilters} style={{ padding: '5px 12px', borderRadius: '7px', border: '1px solid #fca5a5', background: '#fff5f5', color: '#ef4444', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                  Xoá bộ lọc {activeFilterCount > 0 && `(${activeFilterCount})`}
                </button>
              )}
            </div>
          )}

          {/* Row 2 fallback */}
          {tabFilters.length === 0 && hasActiveFilter && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: '#6366f1', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '6px', padding: '3px 8px', fontWeight: 600 }}>
                Đang tìm: "{debouncedQuery}"
              </span>
              <button onClick={handleClearFilters} style={{ padding: '3px 10px', borderRadius: '6px', border: '1px solid #fca5a5', background: '#fff5f5', color: '#ef4444', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                Xoá
              </button>
            </div>
          )}
        </div>

        {/* Error state */}
        {error && (
          <div style={{ padding: '20px 16px', textAlign: 'center', color: '#ef4444', fontSize: '13px', background: '#fff5f5', borderBottom: '1px solid #fee2e2' }}>
            ⚠ {error}
          </div>
        )}

        {/* Table content */}
        {!error && (
          isLoading && !pageData
            ? <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>Đang tải dữ liệu...</div>
            : <CatalogTable
                activeTab={activeTab}
                data={filteredData}
                debouncedQuery={debouncedQuery}
                onEdit={openForm}
                onDelete={setItemToDelete}
                onToggleTemplateActive={handleToggleTemplateActive}
                onCycleStatusChange={handleCycleStatusChange}
              />
        )}

        {/* Pagination */}
        {!hasActiveClientFilter && pageData && pageData.totalPages > 1 && (
          <GenericPagination
            currentPage={pageData.number}
            totalPages={pageData.totalPages}
            totalElements={pageData.totalElements}
            pageSize={pageData.size}
            onPageChange={handlePageChange}
          />
        )}

        {/* Client-side filter fallback */}
        {hasActiveClientFilter && (
          <div style={{ padding: '10px 16px', borderTop: '1px solid #f1f5f9', fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Đang lọc client-side trong <strong style={{ color: '#334155' }}>{pageData?.content.length ?? 0}</strong> bản ghi của trang hiện tại. Xoá bộ lọc để xem toàn bộ.
          </div>
        )}
      </div>

      {/* Form Modal */}
      <CatalogFormModal
        isOpen={isFormOpen}
        activeTab={activeTab}
        tabLabel={currentTab.label}
        editingItem={editingItem}
        formValues={formValues}
        setFormValues={setFormValues}
        isFetchingOptions={isFetchingOptions}
        isLoading={isLoading}
        departmentsList={departmentsList}
        positionsList={positionsList}
        employeesList={employeesList}
        categoriesList={categoriesList}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!itemToDelete}
        onCancel={() => setItemToDelete(null)}
        onConfirm={handleDeleteConfirm}
      />

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes slideIn {
          from { transform: translateX(120%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

// ─── Local Pagination component ──────────────────────────────────────────────

interface GenericPaginationProps {
  currentPage: number;
  totalPages: number;
  totalElements: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

function GenericPagination({ currentPage, totalPages, totalElements, pageSize, onPageChange }: GenericPaginationProps) {
  if (totalPages <= 1) return null;
  const from = currentPage * pageSize + 1;
  const to = Math.min((currentPage + 1) * pageSize, totalElements);

  const getPageNumbers = (): (number | '...')[] => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 0; i < totalPages; i++) pages.push(i);
    } else {
      pages.push(0);
      if (currentPage > 2) pages.push('...');
      const start = Math.max(1, currentPage - 1);
      const end = Math.min(totalPages - 2, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 3) pages.push('...');
      pages.push(totalPages - 1);
    }
    return pages;
  };

  const btnBase: React.CSSProperties = {
    minWidth: '32px', height: '32px', borderRadius: '8px',
    border: '1px solid #e2e8f0', fontSize: '12px', fontWeight: 600,
    cursor: 'pointer', display: 'inline-flex', alignItems: 'center',
    justifyContent: 'center', transition: 'all 0.15s',
  };

  return (
    <div style={{ padding: '14px 16px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
      <span style={{ fontSize: '12px', color: '#94a3b8' }}>
        Hiển thị <strong style={{ color: '#334155' }}>{from}–{to}</strong> / <strong style={{ color: '#334155' }}>{totalElements}</strong> bản ghi
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 0}
            style={{ ...btnBase, background: currentPage === 0 ? '#f8fafc' : '#fff', color: currentPage === 0 ? '#cbd5e1' : '#64748b', cursor: currentPage === 0 ? 'not-allowed' : 'pointer', padding: '0 8px' }}>‹</button>
          {getPageNumbers().map((p, idx) =>
            p === '...'
              ? <span key={`dots-${idx}`} style={{ padding: '0 4px', color: '#94a3b8', fontSize: '12px' }}>…</span>
              : <button key={p} onClick={() => onPageChange(p as number)}
                  style={{ ...btnBase, background: p === currentPage ? '#6366f1' : '#fff', color: p === currentPage ? '#fff' : '#64748b', border: p === currentPage ? '1px solid #6366f1' : '1px solid #e2e8f0', cursor: p === currentPage ? 'default' : 'pointer', padding: '0 8px' }}>
                  {(p as number) + 1}
                </button>
          )}
          <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages - 1}
            style={{ ...btnBase, background: currentPage === totalPages - 1 ? '#f8fafc' : '#fff', color: currentPage === totalPages - 1 ? '#cbd5e1' : '#64748b', cursor: currentPage === totalPages - 1 ? 'not-allowed' : 'pointer', padding: '0 8px' }}>›</button>
        </div>
        <span style={{ fontSize: '11px', color: '#94a3b8' }}>
          Trang <strong style={{ color: '#6366f1' }}>{currentPage + 1}</strong>{' / '}<strong style={{ color: '#334155' }}>{totalPages}</strong>
        </span>
      </div>
    </div>
  );
}
