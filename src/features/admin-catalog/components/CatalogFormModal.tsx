import React from 'react';
import { CustomSelect } from '../../../components/ui';
import {
  DepartmentItem,
  PositionItem,
  EmployeeItem,
  CategoryItem,
  CatalogItem
} from '../types';

interface CatalogFormModalProps {
  isOpen: boolean;
  activeTab: string;
  tabLabel: string;
  editingItem: CatalogItem | null;
  formValues: Record<string, any>;
  setFormValues: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  isFetchingOptions: boolean;
  isLoading: boolean;
  departmentsList: DepartmentItem[];
  positionsList: PositionItem[];
  employeesList: EmployeeItem[];
  categoriesList: CategoryItem[];
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const CatalogFormModal: React.FC<CatalogFormModalProps> = ({
  isOpen,
  activeTab,
  tabLabel,
  editingItem,
  formValues,
  setFormValues,
  isFetchingOptions,
  isLoading,
  departmentsList,
  positionsList,
  employeesList,
  categoriesList,
  onClose,
  onSubmit
}) => {
  if (!isOpen) return null;

  const inputClass = "w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 text-[13px] outline-none focus:border-indigo-500 dark:focus:border-indigo-500 transition-colors disabled:bg-slate-50 dark:disabled:bg-zinc-900/60 disabled:text-slate-400 dark:disabled:text-zinc-500 disabled:cursor-not-allowed mt-1.5";
  const labelClass = "text-xs font-semibold text-slate-600 dark:text-zinc-400";

  const renderFormFields = () => {
    switch (activeTab) {
      case 'positions':
        return (
          <>
            {editingItem && (
              <div>
                <label className={labelClass}>Mã chức vụ</label>
                <input type="text" value={formValues.positionCode || ''} className={inputClass} disabled />
              </div>
            )}
            <div>
              <label className={labelClass}>Tên chức danh *</label>
              <input type="text" value={formValues.title || ''} onChange={e => setFormValues(prev => ({ ...prev, title: e.target.value }))} placeholder="Ví dụ: Giám đốc, Trưởng phòng" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Cấp bậc *</label>
              <CustomSelect
                value={formValues.level || 1}
                onChange={val => setFormValues(prev => ({ ...prev, level: Number(val) }))}
                options={[1, 2, 3, 4, 5].map(n => ({ value: n, label: `Cấp ${n}` }))}
                className="mt-1.5"
              />
            </div>
          </>
        );
      case 'departments':
        return (
          <>
            {editingItem && (
              <div>
                <label className={labelClass}>Mã phòng ban</label>
                <input type="text" value={formValues.departmentCode || ''} className={inputClass} disabled />
              </div>
            )}
            <div>
              <label className={labelClass}>Tên phòng ban *</label>
              <input type="text" value={formValues.name || ''} onChange={e => setFormValues(prev => ({ ...prev, name: e.target.value }))} placeholder="Ví dụ: Phòng Nhân sự" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Phòng ban cha</label>
              <CustomSelect
                value={formValues.parentId || ''}
                onChange={val => setFormValues(prev => ({ ...prev, parentId: val }))}
                options={[
                  { value: '', label: 'Không có (Là phòng ban cấp cao nhất)' },
                  ...departmentsList.filter(d => d.id !== editingItem?.id).map(d => ({
                    value: d.id,
                    label: `${d.name} (${d.departmentCode})`
                  }))
                ]}
                className="mt-1.5"
              />
            </div>
            <div>
              <label className={labelClass}>Trưởng phòng</label>
              <CustomSelect
                value={formValues.managerId || ''}
                onChange={val => setFormValues(prev => ({ ...prev, managerId: val }))}
                options={[
                  { value: '', label: 'Không chỉ định' },
                  ...employeesList.map(emp => ({
                    value: emp.id,
                    label: `${emp.fullName} (${emp.employeeCode})`
                  }))
                ]}
                className="mt-1.5"
              />
            </div>
          </>
        );
      case 'employees':
        return (
          <>
            {editingItem && (
              <div>
                <label className={labelClass}>Mã nhân viên</label>
                <input type="text" value={formValues.employeeCode || ''} className={inputClass} disabled />
              </div>
            )}
            <div>
              <label className={labelClass}>Họ và tên *</label>
              <input type="text" value={formValues.fullName || ''} onChange={e => setFormValues(prev => ({ ...prev, fullName: e.target.value }))} placeholder="Ví dụ: Nguyễn Văn A" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Email *</label>
              <input type="email" value={formValues.email || ''} onChange={e => setFormValues(prev => ({ ...prev, email: e.target.value }))} placeholder="Ví dụ: anguyen@company.com" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Số điện thoại</label>
              <input type="text" value={formValues.phoneNumber || ''} onChange={e => setFormValues(prev => ({ ...prev, phoneNumber: e.target.value }))} placeholder="Ví dụ: 0912345678" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Phòng ban *</label>
              <CustomSelect
                value={formValues.departmentId || ''}
                onChange={val => setFormValues(prev => ({ ...prev, departmentId: val }))}
                options={[
                  { value: '', label: '-- Chọn phòng ban --' },
                  ...departmentsList.map(d => ({ value: d.id, label: d.name }))
                ]}
                className="mt-1.5"
              />
            </div>
            <div>
              <label className={labelClass}>Chức vụ *</label>
              <CustomSelect
                value={formValues.positionId || ''}
                onChange={val => setFormValues(prev => ({ ...prev, positionId: val }))}
                options={[
                  { value: '', label: '-- Chọn chức vụ --' },
                  ...positionsList.map(p => ({ value: p.id, label: p.title }))
                ]}
                className="mt-1.5"
              />
            </div>
          </>
        );
      case 'cycles':
        return (
          <>
            {editingItem && (
              <div>
                <label className={labelClass}>Mã chu kỳ</label>
                <input type="text" value={formValues.cycleCode || ''} className={inputClass} disabled />
              </div>
            )}
            <div>
              <label className={labelClass}>Tên chu kỳ KPI *</label>
              <input type="text" value={formValues.name || ''} onChange={e => setFormValues(prev => ({ ...prev, name: e.target.value }))} placeholder="Ví dụ: Quý 1 - 2026" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Loại chu kỳ *</label>
              <CustomSelect
                value={formValues.type || 'MONTHLY'}
                onChange={val => setFormValues(prev => ({ ...prev, type: String(val) }))}
                options={[
                  { value: 'MONTHLY', label: 'Hàng tháng' },
                  { value: 'QUARTERLY', label: 'Hàng quý' },
                  { value: 'YEARLY', label: 'Hàng năm' }
                ]}
                className="mt-1.5"
              />
            </div>
            <div>
              <label className={labelClass}>Ngày bắt đầu *</label>
              <input type="date" value={formValues.startDate || ''} onChange={e => setFormValues(prev => ({ ...prev, startDate: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Ngày kết thúc *</label>
              <input type="date" value={formValues.endDate || ''} onChange={e => setFormValues(prev => ({ ...prev, endDate: e.target.value }))} className={inputClass} />
            </div>
          </>
        );
      case 'categories':
        return (
          <>
            {editingItem && (
              <div>
                <label className={labelClass}>Mã danh mục</label>
                <input type="text" value={formValues.categoryCode || ''} className={inputClass} disabled />
              </div>
            )}
            <div>
              <label className={labelClass}>Tên danh mục *</label>
              <input type="text" value={formValues.name || ''} onChange={e => setFormValues(prev => ({ ...prev, name: e.target.value }))} placeholder="Ví dụ: Tài chính, Khách hàng" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Mô tả</label>
              <textarea value={formValues.description || ''} onChange={e => setFormValues(prev => ({ ...prev, description: e.target.value }))} placeholder="Nhập mô tả ngắn..." className={`${inputClass} h-20 resize-none`} />
            </div>
          </>
        );
      case 'templates':
        return (
          <>
            {editingItem && (
              <div>
                <label className={labelClass}>Mã tiêu chí mẫu</label>
                <input type="text" value={formValues.templateCode || ''} className={inputClass} disabled />
              </div>
            )}
            <div>
              <label className={labelClass}>Tên tiêu chí *</label>
              <input type="text" value={formValues.name || ''} onChange={e => setFormValues(prev => ({ ...prev, name: e.target.value }))} placeholder="Ví dụ: Đạt doanh số kế hoạch" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Danh mục *</label>
              <CustomSelect
                value={formValues.categoryId || ''}
                onChange={val => setFormValues(prev => ({ ...prev, categoryId: val }))}
                options={[
                  { value: '', label: '-- Chọn danh mục --' },
                  ...categoriesList.map(c => ({ value: c.id, label: c.name }))
                ]}
                className="mt-1.5"
              />
            </div>
            <div>
              <label className={labelClass}>Mô tả</label>
              <textarea value={formValues.description || ''} onChange={e => setFormValues(prev => ({ ...prev, description: e.target.value }))} placeholder="Mô tả tiêu chuẩn đạt..." className={`${inputClass} h-16 resize-none`} />
            </div>
            <div>
              <label className={labelClass}>Đơn vị tính *</label>
              <input type="text" value={formValues.unit || ''} onChange={e => setFormValues(prev => ({ ...prev, unit: e.target.value }))} placeholder="Ví dụ: VNĐ, %, Lượt, Khách hàng" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Kiểu chỉ tiêu *</label>
              <CustomSelect
                value={formValues.targetType || 'HIGHER_IS_BETTER'}
                onChange={val => setFormValues(prev => ({ ...prev, targetType: String(val) }))}
                options={[
                  { value: 'HIGHER_IS_BETTER', label: 'Cao hơn tốt hơn' },
                  { value: 'LOWER_IS_BETTER', label: 'Thấp hơn tốt hơn' },
                  { value: 'TARGET_VALUE', label: 'Đúng mục tiêu' }
                ]}
                className="mt-1.5"
              />
            </div>
            <div>
              <label className={labelClass}>Loại tiêu chí *</label>
              <CustomSelect
                value={formValues.itemType || 'PERCENTAGE'}
                onChange={val => setFormValues(prev => ({ ...prev, itemType: String(val) }))}
                options={[
                  { value: 'PERCENTAGE', label: 'Tỷ lệ (%)' },
                  { value: 'NUMERIC', label: 'Số lượng / Giá trị' }
                ]}
                className="mt-1.5"
              />
            </div>
            {/* Kiểu tổng hợp — chỉ cần thiết khi template dùng cho NUMERIC và có thể có con */}
            <div>
              <label className={labelClass}>Kiểu tổng hợp mặc định</label>
              <CustomSelect
                value={formValues.aggregationType || ''}
                onChange={val => setFormValues(prev => ({ ...prev, aggregationType: val || null }))}
                options={[
                  { value: '', label: '— Không quy định (dùng WEIGHTED_AVERAGE) —' },
                  { value: 'WEIGHTED_AVERAGE', label: 'Trung bình trọng số (Weighted Average)' },
                  { value: 'SUM', label: 'Cộng dồn (Sum)' }
                ]}
                className="mt-1.5"
              />
              <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                Áp dụng khi tiêu chí này có item con. Cha kế thừa từ template nếu không tự chỉ định.
              </p>
            </div>
            <div>
              <label className={labelClass}>Trọng số mặc định (%) *</label>
              <input type="number" min="0" max="100" value={formValues.defaultWeight !== undefined ? formValues.defaultWeight : 0} onChange={e => setFormValues(prev => ({ ...prev, defaultWeight: Number(e.target.value) }))} className={inputClass} />
            </div>
          </>
        );
      case 'accounts':
        return (
          <>
            <div>
              <label className={labelClass}>Tên đăng nhập *</label>
              <input type="text" value={formValues.username || ''} onChange={e => setFormValues(prev => ({ ...prev, username: e.target.value }))} placeholder="Nhập tên đăng nhập" className={inputClass} disabled={!!editingItem} />
            </div>
            <div>
              <label className={labelClass}>Mật khẩu {editingItem ? '(Để trống nếu không muốn đổi)' : '*'}</label>
              <input type="password" value={formValues.password || ''} onChange={e => setFormValues(prev => ({ ...prev, password: e.target.value }))} placeholder="Nhập mật khẩu" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Nhân viên liên kết *</label>
              <CustomSelect
                value={formValues.employeeId || ''}
                onChange={val => setFormValues(prev => ({ ...prev, employeeId: val }))}
                options={[
                  { value: '', label: '-- Chọn nhân viên --' },
                  ...employeesList.map(emp => ({ value: emp.id, label: `${emp.fullName} (${emp.employeeCode})` }))
                ]}
                className="mt-1.5"
              />
            </div>
            <div>
              <label className={labelClass}>Vai trò *</label>
              <div className="flex flex-wrap gap-4 mt-2 p-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg">
                {[
                  { value: 'ADMIN', label: 'Admin (Quản trị)' },
                  { value: 'DIRECTOR', label: 'Director (Ban giám đốc)' },
                  { value: 'MANAGER', label: 'Manager (Quản lý phòng)' },
                  { value: 'EMPLOYEE', label: 'Employee (Nhân viên)' }
                ].map(r => {
                  const isChecked = (formValues.roles || []).includes(r.value);
                  return (
                    <label key={r.value} className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-zinc-350 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={e => {
                          const currentRoles: string[] = formValues.roles || [];
                          const nextRoles = e.target.checked
                            ? [...currentRoles, r.value]
                            : currentRoles.filter(role => role !== r.value);
                          setFormValues(prev => ({ ...prev, roles: nextRoles }));
                        }}
                        className="rounded border-slate-350 dark:border-zinc-800 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                      />
                      {r.label}
                    </label>
                  );
                })}
              </div>
            </div>
            <div>
              <label className={labelClass}>Trạng thái hoạt động *</label>
              <CustomSelect
                value={formValues.status || 'ACTIVE'}
                onChange={val => setFormValues(prev => ({ ...prev, status: String(val) }))}
                options={[
                  { value: 'ACTIVE', label: 'Hoạt động' },
                  { value: 'INACTIVE', label: 'Không hoạt động' },
                  { value: 'LOCKED', label: 'Đã khóa' }
                ]}
                className="mt-1.5"
              />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 dark:bg-zinc-950/60 backdrop-blur-sm flex items-center justify-center z-[1000] p-5 animate-[fadeIn_0.2s_ease]">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-[550px] shadow-xl border border-slate-200 dark:border-zinc-800 overflow-hidden flex flex-col animate-[scaleUp_0.3s_cubic-bezier(0.34,1.56,0.64,1)_forwards]">
        {/* Modal header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-zinc-800/60 flex justify-between items-center bg-slate-50 dark:bg-zinc-800/40">
          <h3 className="m-0 text-base font-bold text-slate-900 dark:text-zinc-50">
            {editingItem ? 'Cập nhật' : 'Thêm mới'} {tabLabel}
          </h3>
          <button 
            type="button" 
            onClick={onClose} 
            className="bg-transparent border-none cursor-pointer text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 p-1 rounded-lg transition-colors flex items-center justify-center"
          >
            <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal body */}
        <form onSubmit={onSubmit} className="flex flex-col h-full">
          <div className="p-6 overflow-y-auto max-h-[70vh] flex flex-col gap-4">
            {isFetchingOptions ? (
              <div className="p-10 text-center text-slate-400 dark:text-zinc-500 text-[13px]">
                <svg className="animate-spin block mx-auto mb-2 text-indigo-500 w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Đang chuẩn bị form...
              </div>
            ) : (
              renderFormFields()
            )}
          </div>

          {/* Modal footer */}
          <div className="px-6 py-4 border-t border-slate-100 dark:border-zinc-800/60 flex justify-end gap-3 bg-slate-50/30 dark:bg-zinc-900/40">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 text-xs font-semibold cursor-pointer transition-colors"
            >
              Hủy
            </button>
            <button 
              type="submit" 
              disabled={isFetchingOptions || isLoading} 
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-sky-500 hover:from-indigo-700 hover:to-sky-600 text-white text-xs font-semibold cursor-pointer shadow-md shadow-indigo-600/10 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Lưu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
