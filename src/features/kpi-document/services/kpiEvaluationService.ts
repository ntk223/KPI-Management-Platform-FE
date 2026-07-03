import { apiClient } from '../../../services/apiClient';
import { ApiResponse } from '../../admin-catalog/types';
import { KpiDocumentDetailDTO } from '../types';

export interface KpiEvaluationDTO {
  id: number;
  documentId: number;
  managerComment: string;
  evaluationRank: string;
  status: 'DRAFT' | 'FINALIZED';
  createdAt: string;
  updatedAt: string;
}

export interface KpiDocumentEvaluationDetailDTO {
  document: KpiDocumentDetailDTO;
  evaluation?: KpiEvaluationDTO;
}

export interface KpiEvaluationSaveDTO {
  managerComment: string;
  evaluationRank: string;
}

export const kpiEvaluationService = {
  async getEvaluationDetail(documentId: number): Promise<ApiResponse<KpiDocumentEvaluationDetailDTO>> {
    const res = await apiClient.get<ApiResponse<KpiDocumentEvaluationDetailDTO>>(`/kpi-document-evaluations/${documentId}`);
    return res.data;
  },

  async getAiSuggestion(documentId: number): Promise<ApiResponse<string>> {
    const res = await apiClient.post<ApiResponse<string>>(`/kpi-document-evaluations/${documentId}/ai-suggestion`);
    return res.data;
  },

  async saveEvaluation(documentId: number, payload: KpiEvaluationSaveDTO): Promise<ApiResponse<KpiEvaluationDTO>> {
    const res = await apiClient.post<ApiResponse<KpiEvaluationDTO>>(`/kpi-document-evaluations/${documentId}`, payload);
    return res.data;
  }
};
