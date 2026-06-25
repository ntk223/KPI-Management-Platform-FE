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
    <div className="flex items-center gap-1.5">
      <label className="text-[11px] text-slate-500 dark:text-zinc-400 font-semibold whitespace-nowrap">
        {filterDef.label}:
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`pl-2.5 pr-7 py-1.5 rounded-md border text-xs outline-none cursor-pointer appearance-none bg-no-repeat bg-[right_8px_center] transition-colors ${
          value 
            ? 'border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/20 text-slate-700 dark:text-zinc-200 font-semibold' 
            : 'border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/40 text-slate-400 dark:text-zinc-500 font-normal'
        }`}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`
        }}
      >
        <option value="" className="bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300">Tất cả</option>
        {filterDef.options.map(opt => (
          <option key={opt.value} value={opt.value} className="bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300">
            {opt.label}
          </option>
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
    <div className="font-sans text-slate-800 dark:text-zinc-100">
      {/* Toast Notifications */}
      <ToastNotification toasts={toasts} />

      {/* Page header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-sky-400 flex items-center justify-center text-white shadow-sm">
              {(() => { const IC = Icon[currentTab.icon as keyof typeof Icon]; return IC ? <IC className="w-5 h-5" /> : <Icon.Database className="w-5 h-5" />; })()}
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-zinc-50 m-0">Quản lý {currentTab.label}</h1>
          </div>
          <p className="text-slate-400 dark:text-zinc-500 text-[13px] m-0 pl-11">
            Quản lý danh sách {currentTab.label.toLowerCase()} của hệ thống KPI
          </p>
        </div>
        <button 
          onClick={() => openForm(null)} 
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-sky-500 hover:from-indigo-700 hover:to-sky-600 text-white border-none text-[13px] font-semibold cursor-pointer shadow-md shadow-indigo-600/15 active:scale-[0.98] transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
          Thêm {currentTab.label.toLowerCase()} mới
        </button>
      </div>

      {/* Table card */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">

        {/* ── Search & Filter toolbar ── */}
        <div className="p-3 px-4 border-b border-slate-100 dark:border-zinc-800/60 flex flex-col gap-2.5">

          {/* Row 1: search input + action buttons */}
          <div className="flex items-center justify-between gap-3 flex-wrap">

            {/* Search input */}
            <div className="relative flex-1 min-w-[200px] max-w-[360px]">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 pointer-events-none w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={searchRef}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={`Tìm kiếm ${currentTab.label.toLowerCase()}...`}
                className={`w-full pl-9 pr-9 py-2 rounded-lg border text-[13px] outline-none transition-colors ${
                  debouncedQuery 
                    ? 'border-indigo-500 dark:border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/20 text-slate-700 dark:text-zinc-200' 
                    : 'border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/40 text-slate-700 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-500'
                }`}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')} 
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 p-0.5 flex"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>

            {/* Right actions */}
            <div className="flex gap-2 items-center shrink-0">
              {isLoading && (
                <span className="text-xs text-indigo-500 dark:text-indigo-400 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  Đang tải...
                </span>
              )}

              {/* Result count badge */}
              {hasActiveFilter ? (
                <span className="text-xs text-indigo-700 dark:text-indigo-300 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/40 rounded-md px-2.5 py-1 font-semibold">
                  {filteredData.length} / {pageData?.content.length ?? 0} kết quả trang
                </span>
              ) : (
                <span className="text-xs text-slate-400 dark:text-zinc-500">
                  Tổng: <strong className="text-slate-700 dark:text-zinc-200 font-semibold">{totalCount}</strong> bản ghi
                </span>
              )}

              <button 
                onClick={() => fetchPage(activeTab, currentPage, debouncedQuery)} 
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                Làm mới
              </button>
            </div>
          </div>

          {/* Row 2: Filter chips */}
          {tabFilters.length > 0 && (
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-semibold flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                BỘ LỌC
              </span>
              {tabFilters.map(fd => (
                <FilterSelect key={fd.key} filterDef={fd} value={filterValues[fd.key] ?? ''} onChange={v => handleFilterChange(fd.key, v)} />
              ))}
              {hasActiveFilter && (
                <button 
                  onClick={handleClearFilters} 
                  className="px-3 py-1 rounded-md border border-rose-200 dark:border-rose-950/60 bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-[11px] font-bold cursor-pointer flex items-center gap-1 transition-all"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                  Xoá bộ lọc {activeFilterCount > 0 && `(${activeFilterCount})`}
                </button>
              )}
            </div>
          )}

          {/* Row 2 fallback */}
          {tabFilters.length === 0 && hasActiveFilter && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-indigo-700 dark:text-indigo-300 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/40 rounded-md px-2.5 py-0.5 font-semibold">
                Đang tìm: "{debouncedQuery}"
              </span>
              <button 
                onClick={handleClearFilters} 
                className="px-2.5 py-0.5 rounded-md border border-rose-200 dark:border-rose-950/60 bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-[11px] font-semibold cursor-pointer transition-colors"
              >
                Xoá
              </button>
            </div>
          )}
        </div>

        {/* Error state */}
        {error && (
          <div className="p-4 px-5 text-center text-rose-600 dark:text-rose-400 text-[13px] bg-rose-50/50 dark:bg-rose-950/20 border-b border-rose-100 dark:border-rose-950/60">
            ⚠ {error}
          </div>
        )}

        {/* Table content */}
        {!error && (
          isLoading && !pageData
            ? <div className="p-10 text-center text-slate-400 dark:text-zinc-500 text-[13px]">Đang tải dữ liệu...</div>
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
          <div className="p-3 px-4 border-t border-slate-100 dark:border-zinc-800/60 text-[11px] text-slate-400 dark:text-zinc-500 flex items-center gap-1.5">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Đang lọc client-side trong <strong className="text-slate-700 dark:text-zinc-200 font-semibold">{pageData?.content.length ?? 0}</strong> bản ghi của trang hiện tại. Xoá bộ lọc để xem toàn bộ.
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

  const btnBase = "min-w-[32px] h-8 rounded-lg border text-xs font-semibold cursor-pointer inline-flex items-center justify-center transition-colors px-2";

  return (
    <div className="p-3.5 px-4 border-t border-slate-100 dark:border-zinc-800/60 flex justify-between items-center gap-2 flex-wrap bg-white dark:bg-zinc-900">
      <span className="text-xs text-slate-400 dark:text-zinc-500">
        Hiển thị <strong className="text-slate-700 dark:text-zinc-200 font-semibold">{from}–{to}</strong> / <strong className="text-slate-700 dark:text-zinc-200 font-semibold">{totalElements}</strong> bản ghi
      </span>
      <div className="flex flex-col items-center gap-1.5">
        <div className="flex gap-1 items-center">
          <button 
            onClick={() => onPageChange(currentPage - 1)} 
            disabled={currentPage === 0}
            className={`${btnBase} ${
              currentPage === 0 
                ? 'bg-slate-50 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-800/60 text-slate-300 dark:text-zinc-650 cursor-not-allowed' 
                : 'bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-700'
            }`}
          >
            ‹
          </button>
          {getPageNumbers().map((p, idx) =>
            p === '...'
              ? <span key={`dots-${idx}`} className="px-1 text-slate-400 dark:text-zinc-500 text-xs">…</span>
              : <button 
                  key={p} 
                  onClick={() => onPageChange(p as number)}
                  className={`${btnBase} ${
                    p === currentPage 
                      ? 'bg-indigo-600 dark:bg-indigo-500 border-indigo-600 dark:border-indigo-500 text-white cursor-default' 
                      : 'bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-700'
                  }`}
                >
                  {(p as number) + 1}
                </button>
          )}
          <button 
            onClick={() => onPageChange(currentPage + 1)} 
            disabled={currentPage === totalPages - 1}
            className={`${btnBase} ${
              currentPage === totalPages - 1 
                ? 'bg-slate-50 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-800/60 text-slate-300 dark:text-zinc-650 cursor-not-allowed' 
                : 'bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-700'
            }`}
          >
            ›
          </button>
        </div>
        <span className="text-[11px] text-slate-400 dark:text-zinc-500">
          Trang <strong className="text-indigo-600 dark:text-indigo-400 font-semibold">{currentPage + 1}</strong>{' / '}<strong className="text-slate-700 dark:text-zinc-200 font-semibold">{totalPages}</strong>
        </span>
      </div>
    </div>
  );
}
