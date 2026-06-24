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
        ? 'bg-amber-50/60 border-amber-200'
        : 'bg-white border-slate-200 hover:border-indigo-200'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 shadow-inner ${
          isManager ? 'bg-amber-200 text-amber-800' : 'bg-indigo-100 text-indigo-700'
        }`}>
          {employee.fullName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-slate-800 truncate">{employee.fullName}</span>
            {isManager && (
              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full border border-amber-200">
                <Crown className="w-2.5 h-2.5" /> Trưởng phòng
              </span>
            )}
          </div>
          {employee.positionTitle && (
            <span className="flex items-center gap-1 text-[10px] text-slate-500 font-semibold mt-0.5">
              <Briefcase className="w-3 h-3" /> {employee.positionTitle}
            </span>
          )}
        </div>
      </div>

      <div className="mt-2.5 space-y-1 border-t border-slate-100/80 pt-2.5">
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
          <Hash className="w-3 h-3 shrink-0" />
          <span className="truncate font-bold text-slate-600">{employee.employeeCode}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
          <Mail className="w-3 h-3 shrink-0" />
          <span className="truncate">{employee.email}</span>
        </div>
        {employee.phoneNumber && (
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
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
    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-violet-100">
            <Building2 className="w-4 h-4 text-violet-700" />
          </div>
          <div>
            <span className="text-sm font-bold text-slate-800">{sub.name}</span>
            <span className="ml-2 text-[10px] font-semibold text-slate-400">({sub.departmentCode})</span>
            {sub.managerName && (
              <p className="text-[10px] text-slate-500 font-semibold mt-0.5 flex items-center gap-1">
                <Crown className="w-2.5 h-2.5 text-amber-500" />
                Trưởng nhóm: <span className="text-slate-700 font-bold">{sub.managerName}</span>
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full shadow-inner">
            {sub.employeeCount} người
          </span>
          {isExpanded
            ? <ChevronDown className="w-4 h-4 text-slate-400" />
            : <ChevronRight className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {isExpanded && (
        <div className="p-4 border-t border-slate-100 bg-white">
          {filteredEmployees.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-400 font-semibold italic">
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
