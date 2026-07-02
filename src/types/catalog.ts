export interface ApiResponse<T> {
  success: boolean;
  status: number;
  message: string;
  data: T;
  timestamp?: string;
}

export interface Position {
  id: number;
  positionCode?: string;
  title: string;
  level: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Department {
  id: number;
  departmentCode?: string;
  name: string;
  parentId?: number | null;
  parentName?: string | null;
  managerId?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Employee {
  id: number;
  employeeCode?: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  departmentId: number;
  departmentName?: string;
  positionId: number;
  positionTitle?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CycleType = 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL';
export type CycleStatus = 'PLANNING' | 'ACTIVE' | 'EVALUATING' | 'CLOSED';

export interface KpiCycle {
  id: number;
  cycleCode?: string;
  name: string;
  type: CycleType;
  startDate: string;
  endDate: string;
  status: CycleStatus;
  createdById?: number;
  createdByName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface KpiCategory {
  id: number;
  categoryCode?: string;
  name: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
}

export type TargetType = 'HIGHER_BETTER' | 'LOWER_BETTER' | 'EXACT';

export interface KpiTemplate {
  id: number;
  templateCode?: string;
  categoryId: number;
  categoryName?: string;
  name: string;
  description?: string;
  unit: string;
  targetType: TargetType;
  itemType: 'PERCENTAGE' | 'NUMERIC' | 'GROUP'; // GROUP giữ tạm tương thích ngược
  /** Kiểu tổng hợp mặc định khi template được dùng cho item có con. */
  aggregationType?: 'SUM' | 'WEIGHTED_AVERAGE';
  defaultWeight: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}
