import { apiClient } from '../../../services/apiClient';
import { ApiResponse, SpringPage, CatalogItem, DepartmentMembersDTO } from '../types';

export const catalogService = {
  /**
   * Fetch a paginated and optionally filtered list of items
   */
  async fetchPage<T extends CatalogItem>(endpoint: string, page: number, size: number, keyword?: string): Promise<SpringPage<T>> {
    const params: any = { page, size, sort: 'id,desc' };
    if (keyword?.trim()) {
      params.keyword = keyword.trim();
    }
    const res = await apiClient.get<ApiResponse<SpringPage<T>>>(endpoint, { params });
    return res.data.data;
  },

  /**
   * Fetch a small payload to count the total elements for a tab
   */
  async fetchCount(endpoint: string): Promise<number> {
    const res = await apiClient.get<ApiResponse<SpringPage<any>>>(endpoint, {
      params: { page: 0, size: 1, sort: 'id,desc' }
    });
    return res.data.data.totalElements;
  },

  /**
   * Fetch a large batch of records to serve as reference data options in dropdowns (e.g. parent departments)
   */
  async fetchAllForDropdown<T extends CatalogItem>(endpoint: string): Promise<T[]> {
    const res = await apiClient.get<ApiResponse<SpringPage<T>>>(endpoint, {
      params: { page: 0, size: 1000 }
    });
    return res.data.data.content;
  },

  /**
   * Create a catalog item
   */
  async createItem<T extends CatalogItem>(endpoint: string, payload: any): Promise<T> {
    const res = await apiClient.post<ApiResponse<T>>(endpoint, payload);
    return res.data.data;
  },

  /**
   * Update a catalog item
   */
  async updateItem<T extends CatalogItem>(endpoint: string, id: number, payload: any): Promise<T> {
    const res = await apiClient.put<ApiResponse<T>>(`${endpoint}/${id}`, payload);
    return res.data.data;
  },

  /**
   * Delete a catalog item
   */
  async deleteItem(endpoint: string, id: number): Promise<void> {
    await apiClient.delete(`${endpoint}/${id}`);
  },

  /**
   * Toggle KPI Template active state
   */
  async toggleTemplateActive(id: number, isActive: boolean): Promise<void> {
    await apiClient.patch(`/kpi-templates/${id}/active`, null, {
      params: { isActive }
    });
  },

  /**
   * Update KPI Cycle status
   */
  async changeCycleStatus<T extends CatalogItem>(id: number, status: string): Promise<T> {
    const res = await apiClient.patch<ApiResponse<T>>(`/kpi-cycles/${id}/status`, null, {
      params: { status }
    });
    return res.data.data;
  },

  /**
   * Get all employees and sub-departments of a department.
   * Used by MANAGER to view full team structure.
   */
  async getDepartmentMembers(departmentId: number): Promise<ApiResponse<DepartmentMembersDTO>> {
    const res = await apiClient.get<ApiResponse<DepartmentMembersDTO>>(`/departments/${departmentId}/members`);
    return res.data;
  }
};

