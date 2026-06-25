import { EmployeeItem, SubDepartmentSummary } from '../types';
import {
  Crown, Hash, Mail, Phone, Briefcase,
  Building2, ChevronDown, ChevronRight
} from 'lucide-react';

/* ─── EmployeeCard ───────────────────────────────────────────── */

export function EmployeeCard({
  employee,
  isManager = false,
}: {
  employee: EmployeeItem;
  isManager?: boolean;
}) {
  return (
    <div className={`p-3.5 rounded-xl border transition-all hover:shadow-md group ${
      isManager
        ? 'bg-amber-50/60 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/60'
        : 'bg-white border-slate-200 hover:border-indigo-200 dark:bg-zinc-900 dark:border-zinc-850 dark:hover:border-indigo-800/80'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 shadow-inner ${
          isManager ? 'bg-amber-200 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
        }`}>
          {employee.fullName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 truncate">{employee.fullName}</span>
            {isManager && (
              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-700 bg-amber-100 border border-amber-250 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60 px-1.5 py-0.5 rounded-full">
                <Crown className="w-2.5 h-2.5" /> Trưởng phòng
              </span>
            )}
          </div>
          {employee.positionTitle && (
            <span className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-zinc-400 font-semibold mt-0.5">
              <Briefcase className="w-3 h-3" /> {employee.positionTitle}
            </span>
          )}
        </div>
      </div>

      <div className="mt-2.5 space-y-1 border-t border-slate-100/80 dark:border-zinc-800/80 pt-2.5">
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-zinc-450 font-medium">
          <Hash className="w-3 h-3 shrink-0" />
          <span className="truncate font-bold text-slate-600 dark:text-zinc-300">{employee.employeeCode}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-zinc-450 font-medium">
          <Mail className="w-3 h-3 shrink-0" />
          <span className="truncate">{employee.email}</span>
        </div>
        {employee.phoneNumber && (
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-zinc-450 font-medium">
            <Phone className="w-3 h-3 shrink-0" />
            <span>{employee.phoneNumber}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── SubDeptPanel ───────────────────────────────────────────── */

export function SubDeptPanel({
  sub,
  isExpanded,
  onToggle,
  managerId,
  searchQuery = '',
}: {
  sub: SubDepartmentSummary;
  isExpanded: boolean;
  onToggle: () => void;
  managerId?: number | null;
  searchQuery?: string;
}) {
  const filteredEmployees = sub.employees.filter(e => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.fullName.toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q) ||
      e.employeeCode.toLowerCase().includes(q) ||
      (e.positionTitle || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-850 transition-colors text-left cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-violet-100 dark:bg-violet-950/60">
            <Building2 className="w-4 h-4 text-violet-700 dark:text-violet-400" />
          </div>
          <div>
            <span className="text-sm font-bold text-slate-800 dark:text-zinc-200">{sub.name}</span>
            <span className="ml-2 text-[10px] font-semibold text-slate-400 dark:text-zinc-550">({sub.departmentCode})</span>
            {sub.managerName && (
              <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-semibold mt-0.5 flex items-center gap-1">
                <Crown className="w-2.5 h-2.5 text-amber-500 dark:text-amber-400" />
                Trưởng nhóm: <span className="text-slate-700 dark:text-zinc-300 font-bold">{sub.managerName}</span>
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold text-slate-500 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-2 py-0.5 rounded-full shadow-inner">
            {sub.employeeCount} người
          </span>
          {isExpanded
            ? <ChevronDown className="w-4 h-4 text-slate-400 dark:text-zinc-500" />
            : <ChevronRight className="w-4 h-4 text-slate-400 dark:text-zinc-500" />}
        </div>
      </button>

      {isExpanded && (
        <div className="p-4 border-t border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          {filteredEmployees.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-400 dark:text-zinc-550 font-semibold italic">
              {searchQuery ? 'Không có nhân viên khớp từ khoá.' : 'Team này chưa có nhân viên nào.'}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredEmployees.map(emp => (
                <EmployeeCard
                  key={emp.id}
                  employee={emp}
                  isManager={emp.id === (sub.managerId ?? managerId)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
