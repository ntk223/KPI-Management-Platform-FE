export interface KpiItemDTO {
  id?: number;
  documentId?: number;
  name: string;
  description?: string;
  unit: string;
  templateId?: number;
  weight: number;
  targetValue: number;
  currentValue?: number;
  targetType: 'HIGHER_BETTER' | 'LOWER_BETTER' | 'EXACT';
  isDeleted?: boolean;
}

export interface KpiDocumentSaveDTO {
  id?: number;
  cycleId: number;
  targetType: 'COMPANY' | 'DEPARTMENT' | 'EMPLOYEE';
  targetId?: number;
  parentDocId?: number;
  sourceType?: 'ASSIGNED' | 'PROPOSED';
  kpiItems: KpiItemDTO[];
}

export interface KpiDocumentDetailDTO {
  id: number;
  documentCode: string;
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
