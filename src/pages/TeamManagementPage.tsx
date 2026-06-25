import React, { useState, useEffect } from 'react';
import { useAuth } from '../features/auth';
import { catalogService } from '../features/admin-catalog/services/catalogService';
import { DepartmentMembersDTO, EmployeeItem } from '../features/admin-catalog/types';
import { EmployeeCard, SubDeptPanel } from '../features/admin-catalog/components/EmployeeComponents';
import { StatCard, EmptyState } from '../components/ui';
import {
  Users, Building2, UserCircle2, Search, RefreshCw, LayoutList
} from 'lucide-react';

export const TeamManagementPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<DepartmentMembersDTO | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSubDepts, setExpandedSubDepts] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState<'all' | 'direct' | 'subdepts'>('all');

  const loadData = async () => {
    if (!user?.department?.id) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await catalogService.getDepartmentMembers(user.department.id);
      if (res.success && res.data) {
        setData(res.data);
        // Auto-expand all sub-departments
        const ids = new Set(res.data.subDepartments.map(s => s.id));
        setExpandedSubDepts(ids);
      } else {
        setError(res.message || 'Không thể tải dữ liệu nhân sự.');
      }
    } catch (e: any) {
      console.error(e);
      setError('Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.department?.id]);

  const toggleSubDept = (id: number) => {
    setExpandedSubDepts(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filterEmployees = (employees: EmployeeItem[]) =>
    employees.filter(e => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        e.fullName.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.employeeCode.toLowerCase().includes(q) ||
        (e.positionTitle || '').toLowerCase().includes(q)
      );
    });

  const totalCount = data
    ? data.employees.length + data.subDepartments.reduce((sum, s) => sum + s.employeeCount, 0)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-zinc-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-650 dark:text-indigo-400" />
            Quản lý Nhân sự Phòng ban
          </h2>
          <p className="text-xs text-slate-400 dark:text-zinc-450 font-semibold mt-1">
            Xem danh sách thành viên và các team trực thuộc phòng{' '}
            <span className="text-slate-600 dark:text-zinc-300 font-bold">{user?.department?.name || '—'}</span>
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800 rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      )}

      {/* Error */}
      {error && !isLoading && (
        <div className="bg-rose-50 border border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/55 rounded-xl p-5 text-sm text-rose-700 dark:text-rose-450 font-medium flex items-center gap-2">
          <span className="font-bold">Lỗi:</span> {error}
        </div>
      )}

      {/* Content */}
      {data && !isLoading && (
        <div className="space-y-4">
          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <StatCard
              label="Tổng nhân sự"
              value={totalCount}
              icon={<Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
              color="bg-indigo-50 border-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-900/50"
            />
            <StatCard
              label="Nhân viên trực tiếp"
              value={data.employees.length}
              icon={<UserCircle2 className="w-5 h-5 text-sky-600 dark:text-sky-400" />}
              color="bg-sky-50 border-sky-100 dark:bg-sky-950/20 dark:border-sky-900/50"
            />
            <StatCard
              label="Phòng ban / Team con"
              value={data.subDepartments.length}
              icon={<Building2 className="w-5 h-5 text-violet-600 dark:text-violet-400" />}
              color="bg-violet-50 border-violet-100 dark:bg-violet-950/20 dark:border-violet-900/50"
            />
          </div>

          {/* Search & Tabs */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
            <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-slate-100 dark:border-zinc-850">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-550" />
                <input
                  type="text"
                  placeholder="Tìm kiếm nhân viên theo tên, email, mã, chức vụ..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs font-medium text-slate-700 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-500 bg-slate-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:bg-white dark:focus:bg-zinc-900 transition"
                />
              </div>
              {/* Tabs */}
              <div className="flex gap-1 bg-slate-100 dark:bg-zinc-800 rounded-lg p-1 text-xs font-bold shrink-0">
                {([
                  { key: 'all', label: 'Tất cả', icon: <LayoutList className="w-3.5 h-3.5" /> },
                  { key: 'direct', label: 'Trực tiếp', icon: <UserCircle2 className="w-3.5 h-3.5" /> },
                  { key: 'subdepts', label: 'Team con', icon: <Building2 className="w-3.5 h-3.5" /> },
                ] as const).map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                      activeTab === tab.key
                        ? 'bg-white text-indigo-700 shadow-sm dark:bg-zinc-900 dark:text-indigo-400'
                        : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200'
                    }`}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 space-y-5">
              {/* Direct employees */}
              {(activeTab === 'all' || activeTab === 'direct') && (
                <section className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-500 dark:text-zinc-450 uppercase tracking-wider flex items-center gap-1.5">
                    <UserCircle2 className="w-4 h-4 text-sky-500" />
                    Nhân viên trực tiếp ({filterEmployees(data.employees).length})
                  </h3>
                  {filterEmployees(data.employees).length === 0 ? (
                    <EmptyState message="Không có nhân viên trực tiếp khớp với từ khoá." />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                      {filterEmployees(data.employees).map(emp => (
                        <EmployeeCard
                          key={emp.id}
                          employee={emp}
                          isManager={emp.id === data.department.managerId}
                        />
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* Sub-departments */}
              {(activeTab === 'all' || activeTab === 'subdepts') &&
                data.subDepartments.length > 0 && (
                  <section className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-violet-500" />
                      Phòng ban / Team con ({data.subDepartments.length})
                    </h3>
                    {data.subDepartments.map(sub => (
                      <SubDeptPanel
                        key={sub.id}
                        sub={sub}
                        isExpanded={expandedSubDepts.has(sub.id)}
                        onToggle={() => toggleSubDept(sub.id)}
                        searchQuery={searchQuery}
                      />
                    ))}
                  </section>
                )}

              {activeTab === 'subdepts' && data.subDepartments.length === 0 && (
                <EmptyState message="Phòng ban của bạn chưa có team con nào." />
              )}
            </div>
          </div>
        </div>
      )}

      {!data && !isLoading && !error && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-sm dark:bg-zinc-900 dark:border-zinc-800">
          Chưa có dữ liệu nhân sự để hiển thị.
        </div>
      )}
    </div>
  );
};

/* ────────── Sub-components ────────── */


export default TeamManagementPage;
