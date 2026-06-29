import { useState, useEffect, useCallback } from 'react';
import { catalogService } from '../services/catalogService';
import {
  SpringPage,
  CatalogItem,
  DepartmentItem,
  PositionItem,
  EmployeeItem,
  CategoryItem,
  CycleItem,
  TemplateItem,
  AccountItem,
  ToastMsg
} from '../types';

const TAB_API_ENDPOINTS: Record<string, string> = {
  positions: '/positions', departments: '/departments', employees: '/employees',
  cycles: '/kpi-cycles', categories: '/kpi-categories', templates: '/kpi-templates',
  accounts: '/accounts',
};

const PAGE_SIZE = 10;

export const useCatalog = (activeTab: string) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(0);

  const [pageData, setPageData] = useState<SpringPage<CatalogItem> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});

  // CRUD modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [itemToDelete, setItemToDelete] = useState<CatalogItem | null>(null);

  // Dropdowns lists
  const [departmentsList, setDepartmentsList] = useState<DepartmentItem[]>([]);
  const [positionsList, setPositionsList] = useState<PositionItem[]>([]);
  const [employeesList, setEmployeesList] = useState<EmployeeItem[]>([]);
  const [categoriesList, setCategoriesList] = useState<CategoryItem[]>([]);
  const [isFetchingOptions, setIsFetchingOptions] = useState(false);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastMsg[]>([]);

  const showToast = useCallback((text: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, text, type, isExiting: false }]);
    
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, isExiting: true } : t));
    }, 2700);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  // Sync debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 280);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Reset states on tab change
  useEffect(() => {
    setSearchQuery('');
    setDebouncedQuery('');
    setFilterValues({});
    setCurrentPage(0);
  }, [activeTab]);

  // Reset page when search term changes
  useEffect(() => {
    setCurrentPage(0);
  }, [debouncedQuery]);

  const fetchPage = useCallback(async (tab: string, page: number, query: string) => {
    const endpoint = TAB_API_ENDPOINTS[tab];
    if (!endpoint) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await catalogService.fetchPage<CatalogItem>(endpoint, page, PAGE_SIZE, query);
      setPageData(data);
      setTabCounts(prev => ({ ...prev, [tab]: data.totalElements }));
    } catch (err) {
      console.error(`[useCatalog] Failed to fetch page for tab ${tab}`, err);
      setError('Không thể tải dữ liệu. Vui lòng thử lại.');
      setPageData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchAllCounts = useCallback(async () => {
    const counts: Record<string, number> = {};
    const tabsList = ['positions', 'departments', 'employees', 'cycles', 'categories', 'templates', 'accounts'];
    await Promise.allSettled(
      tabsList.map(async tab => {
        try {
          const endpoint = TAB_API_ENDPOINTS[tab];
          const count = await catalogService.fetchCount(endpoint);
          counts[tab] = count;
        } catch {
          counts[tab] = 0;
        }
      })
    );
    setTabCounts(counts);
  }, []);

  useEffect(() => {
    fetchPage(activeTab, currentPage, debouncedQuery);
  }, [activeTab, currentPage, debouncedQuery, fetchPage]);

  useEffect(() => {
    fetchAllCounts();
  }, [fetchAllCounts]);

  const fetchFormOptions = async () => {
    setIsFetchingOptions(true);
    try {
      const [depts, poss, emps, cats] = await Promise.all([
        catalogService.fetchAllForDropdown<DepartmentItem>('/departments').catch(() => []),
        catalogService.fetchAllForDropdown<PositionItem>('/positions').catch(() => []),
        catalogService.fetchAllForDropdown<EmployeeItem>('/employees').catch(() => []),
        catalogService.fetchAllForDropdown<CategoryItem>('/kpi-categories').catch(() => []),
      ]);
      setDepartmentsList(depts);
      setPositionsList(poss);
      setEmployeesList(emps);
      setCategoriesList(cats);
    } catch (err) {
      console.error('[useCatalog] Failed to fetch form referentials', err);
    } finally {
      setIsFetchingOptions(false);
    }
  };

  const openForm = (item: CatalogItem | null) => {
    setEditingItem(item);
    if (item) {
      if (activeTab === 'positions') {
        const p = item as PositionItem;
        setFormValues({ positionCode: p.positionCode, title: p.title, level: p.level });
      } else if (activeTab === 'departments') {
        const d = item as DepartmentItem;
        setFormValues({ departmentCode: d.departmentCode, name: d.name, parentId: d.parentId || '', managerId: d.managerId || '' });
      } else if (activeTab === 'employees') {
        const emp = item as EmployeeItem;
        setFormValues({
          employeeCode: emp.employeeCode, fullName: emp.fullName, email: emp.email,
          phoneNumber: emp.phoneNumber || '', departmentId: emp.departmentId || '', positionId: emp.positionId || ''
        });
      } else if (activeTab === 'cycles') {
        const c = item as CycleItem;
        setFormValues({ cycleCode: c.cycleCode, name: c.name, type: c.type, startDate: c.startDate, endDate: c.endDate });
      } else if (activeTab === 'categories') {
        const cat = item as CategoryItem;
        setFormValues({ categoryCode: cat.categoryCode, name: cat.name, description: cat.description || '' });
      } else if (activeTab === 'templates') {
        const t = item as TemplateItem;
        setFormValues({
          templateCode: t.templateCode, categoryId: t.categoryId || '', name: t.name,
          description: t.description || '', unit: t.unit || '', targetType: t.targetType || 'HIGHER_IS_BETTER',
          defaultWeight: t.defaultWeight ?? 0
        });
      } else if (activeTab === 'accounts') {
        const acc = item as AccountItem;
        setFormValues({ username: acc.username, password: '', status: acc.status, employeeId: acc.employeeId || '', roles: acc.roles || [] });
      }
    } else {
      if (activeTab === 'positions') {
        setFormValues({ positionCode: '', title: '', level: 1 });
      } else if (activeTab === 'departments') {
        setFormValues({ departmentCode: '', name: '', parentId: '', managerId: '' });
      } else if (activeTab === 'employees') {
        setFormValues({ employeeCode: '', fullName: '', email: '', phoneNumber: '', departmentId: '', positionId: '' });
      } else if (activeTab === 'cycles') {
        setFormValues({ cycleCode: '', name: '', type: 'MONTHLY', startDate: '', endDate: '' });
      } else if (activeTab === 'categories') {
        setFormValues({ categoryCode: '', name: '', description: '' });
      } else if (activeTab === 'templates') {
        setFormValues({ templateCode: '', categoryId: '', name: '', description: '', unit: '', targetType: 'HIGHER_IS_BETTER', defaultWeight: 0 });
      } else if (activeTab === 'accounts') {
        setFormValues({ username: '', password: '', status: 'ACTIVE', employeeId: '', roles: [] });
      }
    }
    fetchFormOptions();
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = TAB_API_ENDPOINTS[activeTab];
    if (!endpoint) return;

    // Validate inputs
    const errors: string[] = [];
    if (activeTab === 'positions') {
      if (editingItem && !formValues.positionCode?.trim()) errors.push('Mã chức vụ không được để trống');
      if (!formValues.title?.trim()) errors.push('Tên chức danh không được để trống');
      if (formValues.level === undefined || formValues.level === null) errors.push('Cấp bậc không được để trống');
    } else if (activeTab === 'departments') {
      if (editingItem && !formValues.departmentCode?.trim()) errors.push('Mã phòng ban không được để trống');
      if (!formValues.name?.trim()) errors.push('Tên phòng ban không được để trống');
    } else if (activeTab === 'employees') {
      if (editingItem && !formValues.employeeCode?.trim()) errors.push('Mã nhân viên không được để trống');
      if (!formValues.fullName?.trim()) errors.push('Họ tên không được để trống');
      if (!formValues.email?.trim()) errors.push('Email không được để trống');
      else if (!/\S+@\S+\.\S+/.test(formValues.email)) errors.push('Email không đúng định dạng');
      if (!formValues.departmentId) errors.push('Phòng ban không được để trống');
      if (!formValues.positionId) errors.push('Chức vụ không được để trống');
    } else if (activeTab === 'cycles') {
      if (editingItem && !formValues.cycleCode?.trim()) errors.push('Mã chu kỳ không được để trống');
      if (!formValues.name?.trim()) errors.push('Tên chu kỳ không được để trống');
      if (!formValues.startDate) errors.push('Ngày bắt đầu không được để trống');
      if (!formValues.endDate) errors.push('Ngày kết thúc không được để trống');
      if (formValues.startDate && formValues.endDate && new Date(formValues.startDate) >= new Date(formValues.endDate)) {
        errors.push('Ngày kết thúc phải sau ngày bắt đầu');
      }
    } else if (activeTab === 'categories') {
      if (editingItem && !formValues.categoryCode?.trim()) errors.push('Mã danh mục không được để trống');
      if (!formValues.name?.trim()) errors.push('Tên danh mục không được để trống');
    } else if (activeTab === 'templates') {
      if (editingItem && !formValues.templateCode?.trim()) errors.push('Mã tiêu chí mẫu không được để trống');
      if (!formValues.name?.trim()) errors.push('Tên tiêu chí không được để trống');
      if (!formValues.categoryId) errors.push('Danh mục không được để trống');
      if (!formValues.unit?.trim()) errors.push('Đơn vị tính không được để trống');
      if (formValues.defaultWeight === undefined || formValues.defaultWeight === null || formValues.defaultWeight < 0 || formValues.defaultWeight > 100) {
        errors.push('Trọng số mặc định phải từ 0% đến 100%');
      }
    } else if (activeTab === 'accounts') {
      if (!formValues.username?.trim()) errors.push('Tên đăng nhập không được để trống');
      if (!editingItem && !formValues.password?.trim()) errors.push('Mật khẩu không được để trống');
      if (!formValues.employeeId) errors.push('Nhân viên liên kết không được để trống');
      if (!formValues.roles || formValues.roles.length === 0) errors.push('Vui lòng chọn ít nhất một vai trò');
    }

    if (errors.length > 0) {
      showToast(errors[0], 'error');
      return;
    }

    // Convert fields for request payload
    const payload: any = { ...formValues };
    if (payload.parentId === '') payload.parentId = null;
    if (payload.managerId === '') payload.managerId = null;
    if (payload.departmentId) payload.departmentId = Number(payload.departmentId);
    if (payload.positionId) payload.positionId = Number(payload.positionId);
    if (payload.categoryId) payload.categoryId = Number(payload.categoryId);
    if (payload.employeeId) payload.employeeId = Number(payload.employeeId);
    if (payload.level) payload.level = Number(payload.level);
    if (payload.defaultWeight !== undefined) payload.defaultWeight = Number(payload.defaultWeight);

    // Remove code fields if they are blank (so the server auto-generates them)
    if (!payload.positionCode?.trim()) delete payload.positionCode;
    if (!payload.departmentCode?.trim()) delete payload.departmentCode;
    if (!payload.employeeCode?.trim()) delete payload.employeeCode;
    if (!payload.cycleCode?.trim()) delete payload.cycleCode;
    if (!payload.categoryCode?.trim()) delete payload.categoryCode;
    if (!payload.templateCode?.trim()) delete payload.templateCode;

    setIsLoading(true);
    try {
      if (editingItem) {
        await catalogService.updateItem(endpoint, editingItem.id, payload);
        showToast('Cập nhật bản ghi thành công!', 'success');
      } else {
        await catalogService.createItem(endpoint, payload);
        showToast('Thêm mới bản ghi thành công!', 'success');
      }
      setIsFormOpen(false);
      fetchPage(activeTab, currentPage, debouncedQuery);
      fetchAllCounts();
    } catch (err: any) {
      console.error('[useCatalog] Submit failed', err);
      const errMsg = err?.response?.data?.message || err.message || 'Có lỗi xảy ra. Vui lòng kiểm tra dữ liệu.';
      showToast(errMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    const endpoint = TAB_API_ENDPOINTS[activeTab];
    setIsLoading(true);
    try {
      await catalogService.deleteItem(endpoint, itemToDelete.id);
      showToast('Xóa bản ghi thành công!', 'success');
      setItemToDelete(null);
      fetchPage(activeTab, currentPage, debouncedQuery);
      fetchAllCounts();
    } catch (err: any) {
      console.error('[useCatalog] Failed to delete', err);
      const errMsg = err?.response?.data?.message || err.message || 'Không thể xóa bản ghi. Vui lòng kiểm tra lại ràng buộc dữ liệu.';
      showToast(errMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleTemplateActive = async (id: number, currentActive: boolean) => {
    try {
      await catalogService.toggleTemplateActive(id, !currentActive);
      showToast(`Đã ${!currentActive ? 'kích hoạt' : 'vô hiệu hóa'} tiêu chí mẫu`, 'success');
      fetchPage(activeTab, currentPage, debouncedQuery);
    } catch (err: any) {
      console.error('[useCatalog] Failed to toggle template active', err);
      showToast('Lỗi khi cập nhật trạng thái tiêu chí mẫu: ' + (err?.response?.data?.message || err.message || ''), 'error');
    }
  };

  const handleCycleStatusChange = async (id: number, nextStatus: string) => {
    try {
      await catalogService.changeCycleStatus(id, nextStatus);
      showToast(`Đã chuyển trạng thái chu kỳ sang ${nextStatus}`, 'success');
      fetchPage(activeTab, currentPage, debouncedQuery);
    } catch (err: any) {
      console.error('[useCatalog] Failed to change cycle status', err);
      const errMsg = err?.response?.data?.message || err.message || 'Lỗi khi cập nhật trạng thái chu kỳ';
      showToast(errMsg, 'error');
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 0 && (!pageData || page < pageData.totalPages)) {
      setCurrentPage(page);
    }
  };

  const handleFilterChange = (key: string, val: string) => {
    setFilterValues(prev => ({ ...prev, [key]: val }));
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setFilterValues({});
  };

  return {
    searchQuery,
    setSearchQuery,
    debouncedQuery,
    filterValues,
    currentPage,
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
    fetchPage
  };
};
