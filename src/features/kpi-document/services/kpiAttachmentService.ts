import { apiClient } from '../../../services/apiClient';
import { ApiResponse } from '../../admin-catalog/types';
import { KpiAttachmentDTO, PresignedUploadResponse } from '../types';

export const kpiAttachmentService = {
  /**
   * Step 1: Request a pre-signed URL from the backend.
   * Returns { presignedUrl, objectKey }
   */
  async requestPresignedUrl(fileName: string): Promise<ApiResponse<PresignedUploadResponse>> {
    const res = await apiClient.post<ApiResponse<PresignedUploadResponse>>(
      '/kpi-attachments/request-upload',
      null,
      { params: { fileName } }
    );
    return res.data;
  },

  /**
   * Step 2: Upload the file directly to S3 using the pre-signed URL.
   * No auth headers — pure S3 PUT request.
   */
  async uploadToS3(presignedUrl: string, file: File): Promise<void> {
    await fetch(presignedUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: file,
    });
  },

  /**
   * Step 3: Confirm the upload to backend — saves attachment metadata to DB.
   */
  async confirmUpload(payload: {
    fileName: string;
    objectKey: string;
    fileType: string;
    fileSize: number;
    kpiItemId: number;
  }): Promise<ApiResponse<KpiAttachmentDTO>> {
    const res = await apiClient.post<ApiResponse<KpiAttachmentDTO>>(
      '/kpi-attachments/confirm-upload',
      payload
    );
    return res.data;
  },

  /**
   * Get all attachments for a KPI item
   */
  async getByKpiItemId(kpiItemId: number): Promise<ApiResponse<KpiAttachmentDTO[]>> {
    const res = await apiClient.get<ApiResponse<KpiAttachmentDTO[]>>(
      `/kpi-attachments/kpi-item/${kpiItemId}`
    );
    return res.data;
  },

  /**
   * Download attachment — returns a pre-signed download URL
   */
  async getDownloadUrl(attachmentId: number): Promise<ApiResponse<string>> {
    const res = await apiClient.get<ApiResponse<string>>(
      `/kpi-attachments/${attachmentId}/download-url`
    );
    return res.data;
  },

  /**
   * Delete an attachment
   */
  async deleteAttachment(attachmentId: number): Promise<ApiResponse<void>> {
    const res = await apiClient.delete<ApiResponse<void>>(
      `/kpi-attachments/${attachmentId}`
    );
    return res.data;
  },
};
