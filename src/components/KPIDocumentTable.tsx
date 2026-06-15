import React, { useState, useMemo } from 'react';

// TypeScript interfaces for type safety
export type KPIDocumentStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';

export interface KPIRow {
  id: string;
  code: string;
  title: string;
  weight: number; // Percentage, e.g., 20
  targetValue: string;
  actualValue: string;
  status: KPIDocumentStatus;
  lastUpdated: string;
}

interface KPIDocumentTableProps {
  initialData?: KPIRow[];
  onViewDetails?: (id: string) => void;
  onEdit?: (id: string) => void;
}

const statusBadgeStyles: Record<KPIDocumentStatus, string> = {
  APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  DRAFT: 'bg-slate-50 text-slate-600 border-slate-200',
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
};

const statusTranslation: Record<KPIDocumentStatus, string> = {
  APPROVED: 'Đã phê duyệt',
  DRAFT: 'Bản nháp',
  PENDING: 'Chờ duyệt',
  REJECTED: 'Từ chối',
};

const defaultRows: KPIRow[] = [
  {
    id: 'kpi-001',
    code: 'KPI-Q3-01',
    title: 'Phát triển module xác thực phân quyền dựa trên RBAC (Role-Based Access Control)',
    weight: 30,
    targetValue: 'Hoàn thành 100% kiểm thử',
    actualValue: 'Đã hoàn thành và chạy thử',
    status: 'APPROVED',
    lastUpdated: '15/06/2026',
  },
  {
    id: 'kpi-002',
    code: 'KPI-Q3-02',
    title: 'Tối ưu hóa tốc độ tải trang lần đầu (FCP) dưới 1.5 giây',
    weight: 25,
    targetValue: 'FCP < 1.5s',
    actualValue: 'Đạt FCP 1.7s',
    status: 'PENDING',
    lastUpdated: '14/06/2026',
  },
  {
    id: 'kpi-003',
    code: 'KPI-Q3-03',
    title: 'Viết tài liệu API đặc tả hệ thống và hướng dẫn tích hợp CI/CD',
    weight: 15,
    targetValue: 'Tài liệu đầy đủ trên Swagger',
    actualValue: 'Hoàn thiện 80% tài liệu',
    status: 'DRAFT',
    lastUpdated: '12/06/2026',
  },
  {
    id: 'kpi-004',
    code: 'KPI-Q3-04',
    title: 'Hỗ trợ sửa 100% các lỗi nghiêm trọng (Critical Bugs) được phát hiện bởi QA',
    weight: 30,
    targetValue: '0 lỗi nghiêm trọng',
    actualValue: 'Còn tồn đọng 2 lỗi trung bình',
    status: 'REJECTED',
    lastUpdated: '10/06/2026',
  },
];

export const KPIDocumentTable: React.FC<KPIDocumentTableProps> = ({
  initialData = defaultRows,
  onViewDetails,
  onEdit,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Filter logic
  const filteredData = useMemo(() => {
    return initialData.filter((row) => {
      const matchesSearch =
        row.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.code.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus =
        selectedStatus === 'ALL' || row.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [initialData, searchQuery, selectedStatus]);

  const handleView = (id: string) => {
    if (onViewDetails) {
      onViewDetails(id);
    } else {
      console.log('Viewing details of KPI:', id);
    }
  };

  const handleEdit = (id: string) => {
    if (onEdit) {
      onEdit(id);
    } else {
      console.log('Editing KPI:', id);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fadeIn">
      {/* Control panel: Search & Filters */}
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Tìm mã hoặc tên KPI..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-xs text-slate-700 bg-white"
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full sm:w-40 p-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-xs text-slate-600 bg-white"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="DRAFT">Bản nháp</option>
            <option value="PENDING">Chờ duyệt</option>
            <option value="APPROVED">Đã phê duyệt</option>
            <option value="REJECTED">Từ chối</option>
          </select>
        </div>
      </div>

      {/* Main Table view */}
      <div className="overflow-x-auto w-full">
        <table className="min-w-full table-layout-fixed border-collapse">
          {/* Strict Column Width mapping */}
          <colgroup>
            <col className="w-[10%]" />
            <col className="w-[28%]" />
            <col className="w-[10%]" />
            <col className="w-[15%]" />
            <col className="w-[15%]" />
            <col className="w-[12%]" />
            <col className="w-[10%]" />
          </colgroup>

          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Mã KPI</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Tiêu chí chi tiết</th>
              <th className="px-5 py-3.5 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Trọng số</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Chỉ tiêu</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Thực tế</th>
              <th className="px-5 py-3.5 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Trạng thái</th>
              <th className="px-5 py-3.5 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Thao tác</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-150">
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-xs text-slate-400 italic">
                  Không tìm thấy dữ liệu phù hợp.
                </td>
              </tr>
            ) : (
              filteredData.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                  {/* Code */}
                  <td className="px-5 py-4 text-xs font-semibold text-slate-600 whitespace-nowrap overflow-hidden text-ellipsis">
                    {row.code}
                  </td>
                  
                  {/* Title */}
                  <td className="px-5 py-4 text-xs text-slate-800 break-words font-medium">
                    {row.title}
                  </td>
                  
                  {/* Weight */}
                  <td className="px-5 py-4 text-xs text-slate-600 text-center font-bold">
                    {row.weight}%
                  </td>
                  
                  {/* Target */}
                  <td className="px-5 py-4 text-xs text-slate-600 break-words">
                    {row.targetValue}
                  </td>
                  
                  {/* Actual */}
                  <td className="px-5 py-4 text-xs text-slate-600 break-words">
                    {row.actualValue}
                  </td>
                  
                  {/* Status Badge */}
                  <td className="px-5 py-4 whitespace-nowrap text-center">
                    <span className={`inline-flex items-center px-2.5 py-1 text-[11px] font-bold rounded-full border ${statusBadgeStyles[row.status]}`}>
                      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
                      {statusTranslation[row.status]}
                    </span>
                  </td>

                  {/* Actions Column */}
                  <td className="px-5 py-4 whitespace-nowrap text-center text-xs font-medium">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleView(row.id)}
                        className="text-primary hover:text-blue-800 transition-colors p-1"
                        title="Xem chi tiết"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleEdit(row.id)}
                        className="text-slate-500 hover:text-slate-800 transition-colors p-1"
                        title="Chỉnh sửa"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer with Summary stats */}
      <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between text-xs text-slate-500 font-medium">
        <div>
          Hiển thị <span className="font-bold text-slate-700">{filteredData.length}</span> trên <span className="font-bold text-slate-700">{initialData.length}</span> chỉ tiêu KPI.
        </div>
        <div className="flex items-center gap-1.5">
          <span>Tổng trọng số đã phân bổ:</span>
          <span className="font-bold text-slate-800 bg-slate-200/60 px-2 py-0.5 rounded">
            {filteredData.reduce((acc, curr) => acc + curr.weight, 0)}%
          </span>
        </div>
      </div>
    </div>
  );
};
export default KPIDocumentTable;
