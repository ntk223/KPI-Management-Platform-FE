import { apiClient } from '../../../services/apiClient';
import { ApiResponse } from '../../admin-catalog/types';

export interface KpiTrackingLogRequest {
  kpiItemId: number;
  reporterId: number;
  currentValue: number;
  notes?: string;
}


export interface KpiTrackingLogResponse {
  id: number;
  kpiItemId: number;
  valueBefore: number;
  valueDelta: number;
  valueAfter: number;
  notes?: string;
  createdAt: string;
  reporterName?: string;
}

export const kpiTrackingService = {
  /**
   * Log progress for a KPI item (updates current value and creates a tracking log)
   */
  async addProgress(payload: KpiTrackingLogRequest): Promise<ApiResponse<KpiTrackingLogResponse>> {
    const res = await apiClient.post<ApiResponse<KpiTrackingLogResponse>>('/kpi-tracking', payload);
    return res.data;
  },

  /**
   * Get progress log history for a KPI item
   */
  async getHistory(kpiItemId: number): Promise<ApiResponse<KpiTrackingLogResponse[]>> {
    const res = await apiClient.get<ApiResponse<KpiTrackingLogResponse[]>>('/kpi-tracking/history', {
      params: { kpiItemId }
    });
    return res.data;
  },

  /**
   * Get recent progress logs across the system or filtered by employee/department
   */
  async getRecentLogs(employeeId?: number, departmentId?: number, limit = 10): Promise<ApiResponse<KpiTrackingLogResponse[]>> {
    const params: any = { limit };
    if (employeeId) params.employeeId = employeeId;
    if (departmentId) params.departmentId = departmentId;
    const res = await apiClient.get<ApiResponse<KpiTrackingLogResponse[]>>('/kpi-tracking/recent', { params });
    return res.data;
  }
};
