import { apiClient } from '../../../services/apiClient';
import { ApiResponse } from '../../admin-catalog/types';
import { KpiItemDTO } from '../types';

export const kpiItemService = {
  /**
   * Get KPI item details by ID
   */
  async getById(id: number): Promise<ApiResponse<KpiItemDTO>> {
    const res = await apiClient.get<ApiResponse<KpiItemDTO>>(`/kpi-items/${id}`);
    return res.data;
  },

  /**
   * Get all KPI items for a document ID
   */
  async getByDocumentId(documentId: number): Promise<ApiResponse<KpiItemDTO[]>> {
    const res = await apiClient.get<ApiResponse<KpiItemDTO[]>>('/kpi-items', {
      params: { documentId }
    });
    return res.data;
  }
};
