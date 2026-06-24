import { apiClient } from '../../../services/apiClient';
import { ApiResponse } from '../../admin-catalog/types';
import { KpiDocumentSaveDTO, KpiDocumentDetailDTO } from '../types';

export const kpiDocumentService = {
  /**
   * Get KPI documents by cycle, target type and target id
   */
  async getByTarget(cycleId: number, targetType: string, targetId?: number): Promise<ApiResponse<KpiDocumentDetailDTO[]>> {
    const params: any = { cycleId, targetType };
    if (targetId !== undefined && targetId !== null) {
      params.targetId = targetId;
    }
    const res = await apiClient.get<ApiResponse<KpiDocumentDetailDTO[]>>('/kpi-documents', { params });
    return res.data;
  },

  /**
   * Get KPI document details by ID
   */
  async getById(id: number): Promise<ApiResponse<KpiDocumentDetailDTO>> {
    const res = await apiClient.get<ApiResponse<KpiDocumentDetailDTO>>(`/kpi-documents/${id}`);
    return res.data;
  },

  /**
   * Get personal KPI document for currently logged-in user
   */
  async getMyDocument(cycleId: number, employeeId: number): Promise<ApiResponse<KpiDocumentDetailDTO>> {
    const res = await apiClient.get<ApiResponse<KpiDocumentDetailDTO>>('/kpi-documents/my', {
      params: { cycleId, employeeId }
    });
    return res.data;
  },

  /**
   * Create or update a KPI document (Draft)
   */
  async saveOrUpdate(dto: KpiDocumentSaveDTO): Promise<ApiResponse<KpiDocumentDetailDTO>> {
    const res = await apiClient.post<ApiResponse<KpiDocumentDetailDTO>>('/kpi-documents', dto);
    return res.data;
  },

  /**
   * Search KPI documents
   */
  async search(searchDto: any): Promise<ApiResponse<KpiDocumentDetailDTO[]>> {
    const res = await apiClient.post<ApiResponse<KpiDocumentDetailDTO[]>>('/kpi-documents/search', searchDto);
    return res.data;
  },

  /**
   * Submit KPI document for approval
   */
  async submit(id: number): Promise<ApiResponse<any>> {
    const res = await apiClient.patch<ApiResponse<any>>(`/kpi-documents/${id}/submit`);
    return res.data;
  },

  /**
   * Approve KPI document
   */
  async approve(id: number, approverId: number): Promise<ApiResponse<any>> {
    const res = await apiClient.patch<ApiResponse<any>>(`/kpi-documents/${id}/approve`, null, {
      params: { approverId }
    });
    return res.data;
  },

  /**
   * Reject KPI document
   */
  async reject(id: number, reason: string): Promise<ApiResponse<any>> {
    const res = await apiClient.patch<ApiResponse<any>>(`/kpi-documents/${id}/reject`, null, {
      params: { reason }
    });
    return res.data;
  },

  /**
   * Close KPI document
   */
  async close(id: number): Promise<ApiResponse<any>> {
    const res = await apiClient.patch<ApiResponse<any>>(`/kpi-documents/${id}/close`);
    return res.data;
  },

  /**
   * Get pending KPI documents for manager approval
   */
  async getPendingApprovals(managerId: number): Promise<ApiResponse<KpiDocumentDetailDTO[]>> {
    const res = await apiClient.get<ApiResponse<KpiDocumentDetailDTO[]>>('/kpi-documents/pending-approvals', {
      params: { managerId }
    });
    return res.data;
  }
};
