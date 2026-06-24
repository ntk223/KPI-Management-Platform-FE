import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../features/auth';
import { catalogService } from '../features/admin-catalog/services/catalogService';
import { DepartmentItem, EmployeeItem } from '../features/admin-catalog/types';
import { StatCard } from '../components/ui';
import {
  Building2, Crown, Users, ChevronRight, ChevronDown,
  Pencil, Check, X, RefreshCw, Search, Hash, Briefcase, AlertCircle, FolderTree
} from 'lucide-react';

type DeptNode = DepartmentItem & { children: DeptNode[] };

export const DepartmentOrgPage: React.FC = () => {
  const { user: _user } = useAuth();
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Edit state
  const [editingDeptId, setEditingDeptId] = useState<number | null>(null);
  const [editManagerId, setEditManagerId] = useState<number | string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Expanded nodes
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [depts, emps] = await Promise.all([
        catalogService.fetchAllForDropdown<DepartmentItem>('/departments'),
        catalogService.fetchAllForDropdown<EmployeeItem>('/employees'),
      ]);
      setDepartments(depts);
      setEmployees(emps);
      // Auto-expand all
      setExpandedIds(new Set(depts.map(d => d.id)));
    } catch (e) {
      console.error('Error loading data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Build tree structure
  const tree = useMemo<DeptNode[]>(() => {
    const map = new Map<number, DeptNode>();
    departments.forEach(d => map.set(d.id, { ...d, children: [] }));
    const roots: DeptNode[] = [];
    map.forEach(node => {
      if (node.parentId && map.has(node.parentId)) {
        map.get(node.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    });
    return roots;
  }, [departments]);

  // Filter: search by dept name, code, manager name
  const employeeMap = useMemo(() => {
    const m = new Map<number, EmployeeItem>();
    employees.forEach(e => m.set(e.id, e));
    return m;
  }, [employees]);

  const matchesDept = (dept: DepartmentItem) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const manager = dept.managerId ? employeeMap.get(dept.managerId) : null;
    return (
      dept.name.toLowerCase().includes(q) ||
      dept.departmentCode.toLowerCase().includes(q) ||
      (manager?.fullName || '').toLowerCase().includes(q)
    );
  };

  const toggleExpand = (id: number) =>
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  // Start editing
  const startEdit = (dept: DepartmentItem) => {
    setEditingDeptId(dept.id);
    setEditManagerId(dept.managerId ?? '');
    setSaveError(null);
  };

  const cancelEdit = () => {
    setEditingDeptId(null);
    setEditManagerId('');
    setSaveError(null);
  };

  const saveManager = async (dept: DepartmentItem) => {
    setIsSaving(true);
    setSaveError(null);
    try {
      await catalogService.updateItem<DepartmentItem>('/departments', dept.id, {
        departmentCode: dept.departmentCode,
        name: dept.name,
        parentId: dept.parentId ?? null,
        managerId: editManagerId !== '' ? Number(editManagerId) : null,
      });
      await loadData();
      setEditingDeptId(null);
    } catch (e: any) {
      setSaveError(e?.response?.data?.message || 'Không thể lưu thay đổi.');
    } finally {
      setIsSaving(false);
    }
  };

  // Count total employees per dept (direct)
  const empCountByDept = useMemo(() => {
    const m = new Map<number, number>();
    employees.forEach(e => {
      if (e.departmentId) m.set(e.departmentId, (m.get(e.departmentId) || 0) + 1);
    });
    return m;
  }, [employees]);

  const totalDepts = departments.length;
  const deptsWithManager = departments.filter(d => d.managerId).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-violet-600" />
            Tổ chức & Quản lý Phòng ban
          </h2>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            Cấu trúc phòng ban, thông tin trưởng phòng và danh sách nhân sự
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Tổng phòng ban" value={totalDepts} icon={<Building2 className="w-5 h-5 text-violet-600" />} color="bg-violet-50 border-violet-100" />
        <StatCard label="Đã có trưởng phòng" value={deptsWithManager} icon={<Crown className="w-5 h-5 text-amber-600" />} color="bg-amber-50 border-amber-100" />
        <StatCard label="Chưa có trưởng phòng" value={totalDepts - deptsWithManager} icon={<AlertCircle className="w-5 h-5 text-rose-500" />} color="bg-rose-50 border-rose-100" />
        <StatCard label="Tổng nhân sự" value={employees.length} icon={<Users className="w-5 h-5 text-indigo-600" />} color="bg-indigo-50 border-indigo-100" />
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Tìm kiếm phòng ban, mã, trưởng phòng..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 placeholder-slate-400 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-transparent transition"
        />
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
        </div>
      )}

      {/* Tree */}
      {!isLoading && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {tree.length === 0 ? (
            <div className="py-16 text-center text-sm text-slate-400 font-semibold italic">
              Chưa có phòng ban nào trong hệ thống.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {tree.map(root => (
                <DeptNodeRow
                  key={root.id}
                  node={root}
                  depth={0}
                  expandedIds={expandedIds}
                  onToggle={toggleExpand}
                  employeeMap={employeeMap}
                  employees={employees}
                  empCountByDept={empCountByDept}
                  editingDeptId={editingDeptId}
                  editManagerId={editManagerId}
                  setEditManagerId={setEditManagerId}
                  isSaving={isSaving}
                  saveError={saveError}
                  onStartEdit={startEdit}
                  onCancelEdit={cancelEdit}
                  onSave={saveManager}
                  searchQuery={searchQuery}
                  matchesDept={matchesDept}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ── Recursive Tree Row ──────────────────────────────────────────────── */

interface NodeRowProps {
  node: DeptNode;
  depth: number;
  expandedIds: Set<number>;
  onToggle: (id: number) => void;
  employeeMap: Map<number, EmployeeItem>;
  employees: EmployeeItem[];
  empCountByDept: Map<number, number>;
  editingDeptId: number | null;
  editManagerId: number | string;
  setEditManagerId: (v: number | string) => void;
  isSaving: boolean;
  saveError: string | null;
  onStartEdit: (d: DepartmentItem) => void;
  onCancelEdit: () => void;
  onSave: (d: DepartmentItem) => void;
  searchQuery: string;
  matchesDept: (d: DepartmentItem) => boolean;
}

function DeptNodeRow({
  node, depth, expandedIds, onToggle, employeeMap, employees,
  empCountByDept, editingDeptId, editManagerId, setEditManagerId,
  isSaving, saveError, onStartEdit, onCancelEdit, onSave,
  searchQuery, matchesDept
}: NodeRowProps) {
  const isExpanded = expandedIds.has(node.id);
  const hasChildren = node.children.length > 0;
  const manager = node.managerId ? employeeMap.get(node.managerId) : null;
  const empCount = empCountByDept.get(node.id) || 0;
  const isEditing = editingDeptId === node.id;

  // Employees directly in this dept
  const directEmployees = employees.filter(e => e.departmentId === node.id);

  // For search: only show node if it or any descendant matches
  const anyDescendantMatches = (n: DeptNode): boolean =>
    matchesDept(n) || n.children.some(anyDescendantMatches);

  if (searchQuery.trim() && !anyDescendantMatches(node)) return null;

  const indentPx = depth * 24;

  return (
    <>
      {/* Department Row */}
      <div className={`group transition-colors ${depth > 0 ? 'bg-slate-50/50' : 'bg-white'} hover:bg-slate-50`}>
        <div className="flex items-start gap-3 px-5 py-4" style={{ paddingLeft: `${20 + indentPx}px` }}>
          {/* Expand / leaf indicator */}
          <div className="mt-0.5 flex-shrink-0">
            {hasChildren ? (
              <button
                onClick={() => onToggle(node.id)}
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-200 transition-colors text-slate-500"
              >
                {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            ) : (
              <div className="w-5 h-5 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              </div>
            )}
          </div>

          {/* Dept icon */}
          <div className={`p-1.5 rounded-lg flex-shrink-0 mt-0.5 ${depth === 0 ? 'bg-violet-100' : 'bg-slate-100'}`}>
            <Building2 className={`w-4 h-4 ${depth === 0 ? 'text-violet-700' : 'text-slate-500'}`} />
          </div>

          {/* Department info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-slate-800">{node.name}</span>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                {node.departmentCode}
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">
                {empCount} nhân viên
              </span>
            </div>

            {/* Manager section */}
            {isEditing ? (
              <div className="mt-2 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <label className="text-[11px] font-bold text-slate-600 whitespace-nowrap">Trưởng phòng:</label>
                  <select
                    value={editManagerId}
                    onChange={e => setEditManagerId(e.target.value)}
                    className="flex-1 min-w-[200px] px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-violet-300"
                  >
                    <option value="">— Chưa chỉ định —</option>
                    {directEmployees.map(e => (
                      <option key={e.id} value={e.id}>
                        {e.fullName} ({e.employeeCode}) {e.positionTitle ? `— ${e.positionTitle}` : ''}
                      </option>
                    ))}
                    {/* Also allow selecting from all employees */}
                    {employees
                      .filter(e => e.departmentId !== node.id)
                      .map(e => (
                        <option key={`ext-${e.id}`} value={e.id}>
                          ⚠ {e.fullName} ({e.departmentName})
                        </option>
                      ))}
                  </select>
                  <button
                    onClick={() => onSave(node)}
                    disabled={isSaving}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-bold disabled:opacity-50 transition-all"
                  >
                    <Check className="w-3.5 h-3.5" /> {isSaving ? 'Đang lưu...' : 'Lưu'}
                  </button>
                  <button
                    onClick={onCancelEdit}
                    disabled={isSaving}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-bold disabled:opacity-50 transition-all"
                  >
                    <X className="w-3.5 h-3.5" /> Huỷ
                  </button>
                </div>
                {saveError && (
                  <p className="text-[11px] text-rose-600 font-semibold">{saveError}</p>
                )}
              </div>
            ) : (
              <div className="mt-1 flex flex-wrap items-center gap-3">
                {manager ? (
                  <ManagerBadge manager={manager} />
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] text-rose-500 font-bold bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100">
                    <AlertCircle className="w-3 h-3" /> Chưa có trưởng phòng
                  </span>
                )}
                <button
                  onClick={() => onStartEdit(node)}
                  className="opacity-0 group-hover:opacity-100 inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-violet-600 hover:bg-violet-50 rounded-lg border border-violet-200 transition-all"
                >
                  <Pencil className="w-3 h-3" /> Sửa trưởng phòng
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Children (recursive) */}
      {isExpanded && hasChildren && (
        <div className="border-t border-slate-100/70">
          {node.children.map(child => (
            <DeptNodeRow
              key={child.id}
              node={child}
              depth={depth + 1}
              expandedIds={expandedIds}
              onToggle={onToggle}
              employeeMap={employeeMap}
              employees={employees}
              empCountByDept={empCountByDept}
              editingDeptId={editingDeptId}
              editManagerId={editManagerId}
              setEditManagerId={setEditManagerId}
              isSaving={isSaving}
              saveError={saveError}
              onStartEdit={onStartEdit}
              onCancelEdit={onCancelEdit}
              onSave={onSave}
              searchQuery={searchQuery}
              matchesDept={matchesDept}
            />
          ))}
        </div>
      )}
    </>
  );
}

/* ── Manager Badge ───────────────────────────────────────────────────── */
function ManagerBadge({ manager }: { manager: EmployeeItem }) {
  return (
    <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5">
      <div className="w-6 h-6 rounded-full bg-amber-200 flex items-center justify-center text-xs font-extrabold text-amber-800 flex-shrink-0">
        {manager.fullName.charAt(0)}
      </div>
      <div>
        <div className="flex items-center gap-1">
          <Crown className="w-3 h-3 text-amber-600" />
          <span className="text-xs font-bold text-amber-900">{manager.fullName}</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap mt-0.5">
          {manager.positionTitle && (
            <span className="flex items-center gap-0.5 text-[10px] text-amber-700 font-semibold">
              <Briefcase className="w-2.5 h-2.5" /> {manager.positionTitle}
            </span>
          )}
          <span className="flex items-center gap-0.5 text-[10px] text-amber-600 font-semibold">
            <Hash className="w-2.5 h-2.5" /> {manager.employeeCode}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Stat Card ───────────────────────────────────────────────────────── */

export default DepartmentOrgPage;
