export type CycleStatus = 'PLANNING' | 'ACTIVE' | 'EVALUATING' | 'CLOSED';
export type TargetType = 'HIGHER_BETTER' | 'LOWER_BETTER' | 'EXACT';
export type UserRole = 'ADMIN' | 'DIRECTOR' | 'MANAGER' | 'EMPLOYEE';
export type DocStatus = 'DRAFT' | 'IN_PROGRESS' | 'SELF_EVALUATED' | 'EVALUATED';

export interface Cycle {
  id: number;
  name: string;
  status: CycleStatus;
}

export interface Department {
  id: number;
  name: string;
  parentId?: number | null;
}

export interface Position {
  id: number;
  name: string;
  code: string;
}

export interface KpiTemplate {
  id: number;
  name: string;
  unit: string;
  targetType: TargetType;
}

export interface PositionBundle {
  positionId: number;
  templateId: number;
  defaultWeight: number; // e.g. 30 (representing 30%)
}

export interface KpiDocument {
  id: number;
  title: string;
  type: 'COMPANY' | 'DEPARTMENT' | 'EMPLOYEE';
  cycleId: number;
  targetId: number; // represents companyId (always 1), departmentId, or employeeId
  parentDocId?: number | null; // Cascading linkage
  weight: number; // percentage weight in parent OKR (0-100)
  targetValue: number;
  currentValue: number;
  unit: string;
  selfScore?: number | null;
  managerScore?: number | null;
  finalScore?: number | null;
  status: DocStatus;
  employeeName?: string; // used for EMPLOYEE type
  positionName?: string; // used for EMPLOYEE type
  proofText?: string;
  proofFile?: string;
}

// ─── Recursive Tree Helper for UI ──────────────────────────────────────────────
export interface DepartmentNode extends Department {
  children: DepartmentNode[];
}

export function buildDepartmentTree(depts: Department[], parentId: number | null = null): DepartmentNode[] {
  return depts
    .filter(d => (parentId === null ? !d.parentId : d.parentId === parentId))
    .map(d => ({
      ...d,
      children: buildDepartmentTree(depts, d.id),
    }));
}

// ─── Initial Mock Data ──────────────────────────────────────────────────────────

export const initialCycles: Cycle[] = [
  { id: 1, name: 'Chu kỳ Q1 - 2026', status: 'CLOSED' },
  { id: 2, name: 'Chu kỳ Q2 - 2026', status: 'EVALUATING' },
  { id: 3, name: 'Chu kỳ Q3 - 2026', status: 'ACTIVE' },
  { id: 4, name: 'Chu kỳ Q4 - 2026', status: 'PLANNING' },
];

export const initialDepartments: Department[] = [
  { id: 1, name: 'Ban Giám Đốc', parentId: null },
  { id: 2, name: 'Phòng Bán Hàng (Sales)', parentId: 1 },
  { id: 3, name: 'Phòng Phát Triển (Development)', parentId: 1 },
  { id: 4, name: 'Đội Ngũ AI (AI Team)', parentId: 3 },
  { id: 5, name: 'Đội Ngũ Hệ Thống (System Team)', parentId: 3 },
  { id: 6, name: 'Phòng Quản Lý Chất Lượng (QA/Testing)', parentId: 1 },
  { id: 7, name: 'Phòng Quản Lý Dự Án (PM)', parentId: 1 },
];

export const initialPositions: Position[] = [
  { id: 1, name: 'Kỹ sư AI chuyên nghiệp', code: 'DEV_AI' },
  { id: 2, name: 'Kỹ sư hệ thống Cloud', code: 'DEV_SYSTEM' },
  { id: 3, name: 'Chuyên viên kiểm thử QA', code: 'TESTER' },
  { id: 4, name: 'Trưởng phòng kinh doanh', code: 'SALE_MANAGER' },
  { id: 5, name: 'Nhân viên kinh doanh', code: 'SALE_STAFF' },
  { id: 6, name: 'Quản trị dự án PM', code: 'PM' },
];

export const initialKpiTemplates: KpiTemplate[] = [
  { id: 1, name: 'Doanh số ký kết mới', unit: 'VNĐ', targetType: 'HIGHER_BETTER' },
  { id: 2, name: 'Số lượng lead khách hàng liên hệ', unit: 'Lead', targetType: 'HIGHER_BETTER' },
  { id: 3, name: 'Độ trễ phản hồi Core API', unit: 'ms', targetType: 'LOWER_BETTER' },
  { id: 4, name: 'Số lượng Bug nghiêm trọng thoát lên Product', unit: 'Bug', targetType: 'LOWER_BETTER' },
  { id: 5, name: 'Số lượng bài báo nghiên cứu AI công bố', unit: 'Bài viết', targetType: 'HIGHER_BETTER' },
  { id: 6, name: 'Tỷ lệ uptime hệ thống cloud', unit: '%', targetType: 'HIGHER_BETTER' },
  { id: 7, name: 'Tỷ lệ hoàn thành công việc đúng hạn (SLA)', unit: '%', targetType: 'HIGHER_BETTER' },
  { id: 8, name: 'Khảo sát độ hài lòng khách hàng (CSAT)', unit: 'Điểm', targetType: 'EXACT' },
];

export const initialPositionBundles: PositionBundle[] = [
  // DEV_AI (Position 1)
  { positionId: 1, templateId: 5, defaultWeight: 40 }, // Research AI (40%)
  { positionId: 1, templateId: 7, defaultWeight: 45 }, // SLA (45%)
  { positionId: 1, templateId: 3, defaultWeight: 15 }, // API Latency (15%)

  // DEV_SYSTEM (Position 2)
  { positionId: 2, templateId: 6, defaultWeight: 50 }, // Cloud Uptime (50%)
  { positionId: 2, templateId: 7, defaultWeight: 30 }, // SLA (30%)
  { positionId: 2, templateId: 3, defaultWeight: 20 }, // API Latency (20%)

  // TESTER (Position 3)
  { positionId: 3, templateId: 4, defaultWeight: 40 }, // Critical Bugs (40%)
  { positionId: 3, templateId: 7, defaultWeight: 40 }, // SLA (40%)
  { positionId: 3, templateId: 8, defaultWeight: 20 }, // CSAT (20%)

  // SALE_STAFF (Position 5)
  { positionId: 5, templateId: 1, defaultWeight: 60 }, // Revenue (60%)
  { positionId: 5, templateId: 2, defaultWeight: 30 }, // Leads (30%)
  { positionId: 5, templateId: 7, defaultWeight: 10 }, // SLA (10%)
];

export const initialKpiDocuments: KpiDocument[] = [
  // COMPANY LEVEL (Cycle 3 - ACTIVE)
  {
    id: 100,
    title: 'Mục tiêu chiến lược tập đoàn Q3/2026',
    type: 'COMPANY',
    cycleId: 3,
    targetId: 1,
    weight: 100,
    targetValue: 100,
    currentValue: 74,
    unit: '%',
    status: 'IN_PROGRESS',
  },

  // DEPARTMENT LEVEL (Cycle 3 - ACTIVE)
  {
    id: 200,
    title: 'Chỉ tiêu Doanh số phòng Sales Q3/2026',
    type: 'DEPARTMENT',
    cycleId: 3,
    targetId: 2, // Sales Department
    parentDocId: 100,
    weight: 40,
    targetValue: 5000000000,
    currentValue: 3800000000,
    unit: 'VNĐ',
    status: 'IN_PROGRESS',
  },
  {
    id: 201,
    title: 'Kế hoạch phát triển công nghệ AI & Uptime phòng Dev Q3/2026',
    type: 'DEPARTMENT',
    cycleId: 3,
    targetId: 3, // Dev Department
    parentDocId: 100,
    weight: 40,
    targetValue: 95,
    currentValue: 92,
    unit: '%',
    status: 'IN_PROGRESS',
  },
  {
    id: 202,
    title: 'Kế hoạch kiểm thử & Đảm bảo SLA phòng QA Q3/2026',
    type: 'DEPARTMENT',
    cycleId: 3,
    targetId: 6, // QA Department
    parentDocId: 100,
    weight: 20,
    targetValue: 98,
    currentValue: 95,
    unit: '%',
    status: 'IN_PROGRESS',
  },

  // EMPLOYEE LEVEL (Cycle 3 - ACTIVE)
  // Dev AI Employees (Linked to Dept Doc 201)
  {
    id: 300,
    title: 'Phát triển mô hình LLM & API tối ưu hóa',
    type: 'EMPLOYEE',
    cycleId: 3,
    targetId: 101, // Employee ID: 101 (Nguyễn Văn AI)
    parentDocId: 201,
    weight: 40,
    targetValue: 3,
    currentValue: 2,
    unit: 'Bài viết',
    selfScore: null,
    managerScore: null,
    finalScore: null,
    status: 'IN_PROGRESS',
    employeeName: 'Nguyễn Văn AI',
    positionName: 'Kỹ sư AI chuyên nghiệp',
  },
  {
    id: 301,
    title: 'Thời gian phản hồi Core API ổn định',
    type: 'EMPLOYEE',
    cycleId: 3,
    targetId: 101, // Nguyễn Văn AI
    parentDocId: 201,
    weight: 60,
    targetValue: 150,
    currentValue: 120, // Lower is better, so this is completed!
    unit: 'ms',
    selfScore: null,
    managerScore: null,
    finalScore: null,
    status: 'IN_PROGRESS',
    employeeName: 'Nguyễn Văn AI',
    positionName: 'Kỹ sư AI chuyên nghiệp',
  },

  // Sale staff Employees (Linked to Dept Doc 200)
  {
    id: 302,
    title: 'Doanh số bán hàng cá nhân Q3',
    type: 'EMPLOYEE',
    cycleId: 3,
    targetId: 102, // Employee ID: 102 (Lê Thị Sales)
    parentDocId: 200,
    weight: 70,
    targetValue: 1000000000,
    currentValue: 1100000000, // Completed!
    unit: 'VNĐ',
    selfScore: 95,
    managerScore: null,
    finalScore: null,
    status: 'SELF_EVALUATED',
    employeeName: 'Lê Thị Sales',
    positionName: 'Nhân viên kinh doanh',
    proofText: 'Đã hoàn thành ký hợp đồng trị giá 1.1 tỷ với đối tác VinGroup ngày 15/09.',
    proofFile: 'VinGroup_Contract_Signed.pdf',
  },
  {
    id: 303,
    title: 'Tìm kiếm lead khách hàng tiềm năng',
    type: 'EMPLOYEE',
    cycleId: 3,
    targetId: 102, // Lê Thị Sales
    parentDocId: 200,
    weight: 30,
    targetValue: 50,
    currentValue: 48,
    unit: 'Lead',
    selfScore: 90,
    managerScore: null,
    finalScore: null,
    status: 'SELF_EVALUATED',
    employeeName: 'Lê Thị Sales',
    positionName: 'Nhân viên kinh doanh',
    proofText: 'Ghi nhận 48 Leads trên CRM đã được verify số điện thoại.',
  },

  // QA Employee (Linked to Dept Doc 202)
  {
    id: 304,
    title: 'Đảm bảo tỷ lệ bug thoát thấp',
    type: 'EMPLOYEE',
    cycleId: 3,
    targetId: 103, // Employee ID: 103 (Trần QA)
    parentDocId: 202,
    weight: 50,
    targetValue: 2,
    currentValue: 1, // Upto targets
    unit: 'Bug',
    selfScore: null,
    managerScore: null,
    finalScore: null,
    status: 'DRAFT',
    employeeName: 'Trần QA',
    positionName: 'Chuyên viên kiểm thử QA',
  },
];
