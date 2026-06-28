export interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  status: number;
  message: string;
  data: T;
}

// ─── Catalog item types ─────────────────────────────────────────────────────────

export interface PositionItem {
  id: number;
  positionCode: string;
  title: string;
  level: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface DepartmentItem {
  id: number;
  departmentCode: string;
  name: string;
  parentId?: number | null;
  parentName?: string | null;
  managerId?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface EmployeeItem {
  id: number;
  employeeCode: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  departmentId?: number;
  departmentName?: string;
  positionId?: number;
  positionTitle?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CycleItem {
  id: number;
  cycleCode: string;
  name: string;
  type: string;
  startDate: string;
  endDate: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryItem {
  id: number;
  categoryCode: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TemplateItem {
  id: number;
  templateCode: string;
  name: string;
  categoryId?: number;
  categoryName?: string;
  unit?: string;
  targetType?: string;
  defaultWeight?: number;
  isActive?: boolean;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AccountItem {
  id: number;
  username: string;
  status: 'ACTIVE' | 'INACTIVE' | 'LOCKED';
  provider?: string;
  employeeId?: number;
  employeeCode?: string;
  fullName?: string;
  email?: string;
  roles?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export type CatalogItem = PositionItem | DepartmentItem | EmployeeItem | CycleItem | CategoryItem | TemplateItem | AccountItem;

// ─── Filter config per tab ──────────────────────────────────────────────────────

export interface FilterOption { value: string; label: string; }

export interface FilterDef {
  key: string;
  label: string;
  options: FilterOption[];
  test: (item: CatalogItem, value: string) => boolean;
}

export const TAB_FILTERS: Record<string, FilterDef[]> = {
  positions: [
    {
      key: 'level', label: 'Cấp bậc',
      options: [
        { value: '1', label: 'Cấp 1' }, { value: '2', label: 'Cấp 2' },
        { value: '3', label: 'Cấp 3' }, { value: '4', label: 'Cấp 4' },
        { value: '5', label: 'Cấp 5' },
      ],
      test: (item, v) => String((item as PositionItem).level) === v,
    },
  ],
  cycles: [
    {
      key: 'status', label: 'Trạng thái',
      options: [
        { value: 'PLANNING', label: 'Chuẩn bị' }, { value: 'ACTIVE', label: 'Đang chạy' },
        { value: 'EVALUATING', label: 'Đánh giá' }, { value: 'CLOSED', label: 'Đã đóng' },
      ],
      test: (item, v) => (item as CycleItem).status === v,
    },
    {
      key: 'type', label: 'Loại',
      options: [
        { value: 'MONTHLY', label: 'Hàng tháng' }, { value: 'QUARTERLY', label: 'Hàng quý' },
        { value: 'YEARLY', label: 'Hàng năm' },
      ],
      test: (item, v) => (item as CycleItem).type === v,
    },
  ],
  templates: [
    {
      key: 'isActive', label: 'Trạng thái',
      options: [{ value: 'true', label: 'Hoạt động' }, { value: 'false', label: 'Tắt' }],
      test: (item, v) => String((item as TemplateItem).isActive) === v,
    },
    {
      key: 'targetType', label: 'Kiểu chỉ tiêu',
      options: [
        { value: 'HIGHER_IS_BETTER', label: 'Cao hơn tốt hơn' },
        { value: 'LOWER_IS_BETTER', label: 'Thấp hơn tốt hơn' },
        { value: 'TARGET_VALUE', label: 'Đúng mục tiêu' },
      ],
      test: (item, v) => (item as TemplateItem).targetType === v,
    },
  ],
  accounts: [
    {
      key: 'status', label: 'Trạng thái',
      options: [
        { value: 'ACTIVE', label: 'Hoạt động' },
        { value: 'INACTIVE', label: 'Không hoạt động' },
        { value: 'LOCKED', label: 'Đã khoá' },
      ],
      test: (item, v) => (item as AccountItem).status === v,
    },
    {
      key: 'provider', label: 'Provider',
      options: [{ value: 'LOCAL', label: 'Local' }, { value: 'GOOGLE', label: 'Google' }],
      test: (item, v) => ((item as AccountItem).provider ?? 'LOCAL') === v,
    },
  ],
  employees: [],
  departments: [],
  categories: [],
};

export interface ToastMsg { id: string; text: string; type: 'success' | 'error' | 'info'; isExiting?: boolean; }

// ─── Department Members (for MANAGER team view) ──────────────────────────────

export interface SubDepartmentSummary {
  id: number;
  departmentCode: string;
  name: string;
  managerId?: number | null;
  managerName?: string | null;
  employeeCount: number;
  employees: EmployeeItem[];
}

export interface DepartmentMembersDTO {
  department: DepartmentItem;
  employees: EmployeeItem[];           // Nhân viên trực tiếp của phòng
  subDepartments: SubDepartmentSummary[]; // Các phòng/team con
}
