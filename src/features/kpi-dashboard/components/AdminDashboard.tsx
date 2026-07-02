import React from 'react';
import { DirectorDashboard } from './DirectorDashboard';

interface AdminDashboardProps {
  user: any;
  cycles: any[];
  departments: any[];
  currentDocs: any[];
  recentLogs: any[];
  selectedCycleId: number | '';
  setSelectedCycleId: (val: number | '') => void;
  isLoading: boolean;
  loadDashboardData: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = (props) => {
  return (
    <div className="space-y-4">
      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 p-3 rounded-xl text-amber-850 dark:text-amber-300 text-xs font-bold flex items-center justify-between shadow-sm">
        <span>🔒 Quyền Quản trị viên (Administrator Mode): Bạn đang xem dữ liệu hiệu suất toàn công ty với quyền tối cao.</span>
        <a href="/admin/catalog" className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors text-[10px] font-black uppercase">
          Đi tới Cấu hình Danh mục
        </a>
      </div>
      <DirectorDashboard {...props} />
    </div>
  );
};
