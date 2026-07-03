export interface PresignedUploadResponse {
  presignedUrl: string;
  objectKey: string;
}

export interface KpiAttachmentDTO {
  id: number;
  kpiItemId: number;
  fileName: string;
  objectKey: string;
  fileType: string;
  fileSize: number;
  uploadedBy?: string;
  uploadedAt?: string;
}

export interface KpiItemDTO {
  id?: number;
  documentId?: number;
  parentId?: number;
  name: string;
  description?: string;
  unit: string;
  templateId?: number;
  parentWeight: number;
  documentWeight: number;
  targetValue: number;
  currentValue?: number;
  progress?: number;
  targetType: 'HIGHER_BETTER' | 'LOWER_BETTER' | 'EXACT';
  /** NUMERIC = số lượng, PERCENTAGE = tỷ lệ %. GROUP đã bị bỏ — dùng hasChildren thay thế. */
  itemType?: 'PERCENTAGE' | 'NUMERIC' | 'GROUP'; // GROUP giữ tạm tương thích ngược
  /** Loại tính toán gốc trước khi item trở thành nhóm. */
  originalItemType?: 'PERCENTAGE' | 'NUMERIC';
  /** Kiểu tổng hợp khi item có con. */
  aggregationType?: 'SUM' | 'WEIGHTED_AVERAGE';
  /** true nếu item này có ít nhất 1 item con active (thay thế logic GROUP). */
  hasChildren?: boolean;
  isDeleted?: boolean;
  selfScore?: number;
  managerScore?: number;
  finalScore?: number;
}

export interface KpiDocumentSaveDTO {
  id?: number;
  cycleId: number;
  targetType: 'COMPANY' | 'DEPARTMENT' | 'EMPLOYEE';
  targetId?: number;
  parentDocId?: number;
  sourceType?: 'ASSIGNED' | 'PROPOSED';
  isDraft?: boolean;
  kpiItems: KpiItemDTO[];
}

export interface KpiDocumentDetailDTO {
  id: number;
  documentCode: string;
  totalProgress?: number;
  cycleId: number;
  cycleName: string;
  targetType: 'COMPANY' | 'DEPARTMENT' | 'EMPLOYEE';
  targetId?: number;
  targetName: string;
  parentDocId?: number;
  parentDocCode?: string;
  sourceType: 'ASSIGNED' | 'PROPOSED';
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'IN_PROGRESS' | 'SELF_EVALUATED' | 'MANAGER_EVALUATED' | 'CLOSED';
  createdBy?: string;
  approvedBy?: string;
  createdAt: string;
  submittedAt?: string;
  approvedAt?: string;
  closedAt?: string;
  kpiItems: KpiItemDTO[];
}
