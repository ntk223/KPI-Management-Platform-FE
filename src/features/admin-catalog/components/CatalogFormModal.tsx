import React from 'react';
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
            <div>
              <label className={labelClass}>Mã chức vụ *</label>
              <input type="text" value={formValues.positionCode || ''} onChange={e => setFormValues(prev => ({ ...prev, positionCode: e.target.value }))} placeholder="Ví dụ: GD, TP, NV" className={inputClass} disabled={!!editingItem} />
            </div>
            <div>
              <label className={labelClass}>Tên chức danh *</label>
              <input type="text" value={formValues.title || ''} onChange={e => setFormValues(prev => ({ ...prev, title: e.target.value }))} placeholder="Ví dụ: Giám đốc, Trưởng phòng" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Cấp bậc *</label>
              <select value={formValues.level || 1} onChange={e => setFormValues(prev => ({ ...prev, level: Number(e.target.value) }))} className={inputClass}>
                {[1, 2, 3, 4, 5].map(n => <option key={n} value={n} className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200">Cấp {n}</option>)}
              </select>
            </div>
          </>
        );
      case 'departments':
        return (
          <>
            <div>
              <label className={labelClass}>Mã phòng ban *</label>
              <input type="text" value={formValues.departmentCode || ''} onChange={e => setFormValues(prev => ({ ...prev, departmentCode: e.target.value }))} placeholder="Ví dụ: HR, IT, MKT" className={inputClass} disabled={!!editingItem} />
            </div>
            <div>
              <label className={labelClass}>Tên phòng ban *</label>
              <input type="text" value={formValues.name || ''} onChange={e => setFormValues(prev => ({ ...prev, name: e.target.value }))} placeholder="Ví dụ: Phòng Nhân sự" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Phòng ban cha</label>
              <select value={formValues.parentId || ''} onChange={e => setFormValues(prev => ({ ...prev, parentId: e.target.value }))} className={inputClass}>
                <option value="" className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200">Không có (Là phòng ban cấp cao nhất)</option>
                {departmentsList.filter(d => d.id !== editingItem?.id).map(d => (
                  <option key={d.id} value={d.id} className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200">{d.name} ({d.departmentCode})</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Trưởng phòng</label>
              <select value={formValues.managerId || ''} onChange={e => setFormValues(prev => ({ ...prev, managerId: e.target.value }))} className={inputClass}>
                <option value="" className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200">Không chỉ định</option>
                {employeesList.map(emp => (
                  <option key={emp.id} value={emp.id} className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200">{emp.fullName} ({emp.employeeCode})</option>
                ))}
              </select>
            </div>
          </>
        );
      case 'employees':
        return (
          <>
            <div>
              <label className={labelClass}>Mã nhân viên *</label>
              <input type="text" value={formValues.employeeCode || ''} onChange={e => setFormValues(prev => ({ ...prev, employeeCode: e.target.value }))} placeholder="Ví dụ: NV001" className={inputClass} disabled={!!editingItem} />
            </div>
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
              <select value={formValues.departmentId || ''} onChange={e => setFormValues(prev => ({ ...prev, departmentId: e.target.value }))} className={inputClass}>
                <option value="" className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200">-- Chọn phòng ban --</option>
                {departmentsList.map(d => <option key={d.id} value={d.id} className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200">{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Chức vụ *</label>
              <select value={formValues.positionId || ''} onChange={e => setFormValues(prev => ({ ...prev, positionId: e.target.value }))} className={inputClass}>
                <option value="" className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200">-- Chọn chức vụ --</option>
                {positionsList.map(p => <option key={p.id} value={p.id} className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200">{p.title}</option>)}
              </select>
            </div>
          </>
        );
      case 'cycles':
        return (
          <>
            <div>
              <label className={labelClass}>Mã chu kỳ *</label>
              <input type="text" value={formValues.cycleCode || ''} onChange={e => setFormValues(prev => ({ ...prev, cycleCode: e.target.value }))} placeholder="Ví dụ: CY2026_Q1" className={inputClass} disabled={!!editingItem} />
            </div>
            <div>
              <label className={labelClass}>Tên chu kỳ KPI *</label>
              <input type="text" value={formValues.name || ''} onChange={e => setFormValues(prev => ({ ...prev, name: e.target.value }))} placeholder="Ví dụ: Quý 1 - 2026" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Loại chu kỳ *</label>
              <select value={formValues.type || 'MONTHLY'} onChange={e => setFormValues(prev => ({ ...prev, type: e.target.value }))} className={inputClass}>
                <option value="MONTHLY" className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200">Hàng tháng</option>
                <option value="QUARTERLY" className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200">Hàng quý</option>
                <option value="YEARLY" className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200">Hàng năm</option>
              </select>
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
            <div>
              <label className={labelClass}>Mã danh mục *</label>
              <input type="text" value={formValues.categoryCode || ''} onChange={e => setFormValues(prev => ({ ...prev, categoryCode: e.target.value }))} placeholder="Ví dụ: FIN, CUS, ENG" className={inputClass} disabled={!!editingItem} />
            </div>
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
            <div>
              <label className={labelClass}>Mã tiêu chí mẫu *</label>
              <input type="text" value={formValues.templateCode || ''} onChange={e => setFormValues(prev => ({ ...prev, templateCode: e.target.value }))} placeholder="Ví dụ: REV_01" className={inputClass} disabled={!!editingItem} />
            </div>
            <div>
              <label className={labelClass}>Tên tiêu chí *</label>
              <input type="text" value={formValues.name || ''} onChange={e => setFormValues(prev => ({ ...prev, name: e.target.value }))} placeholder="Ví dụ: Đạt doanh số kế hoạch" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Danh mục *</label>
              <select value={formValues.categoryId || ''} onChange={e => setFormValues(prev => ({ ...prev, categoryId: e.target.value }))} className={inputClass}>
                <option value="" className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200">-- Chọn danh mục --</option>
                {categoriesList.map(c => <option key={c.id} value={c.id} className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200">{c.name}</option>)}
              </select>
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
              <select value={formValues.targetType || 'HIGHER_IS_BETTER'} onChange={e => setFormValues(prev => ({ ...prev, targetType: e.target.value }))} className={inputClass}>
                <option value="HIGHER_IS_BETTER" className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200">Cao hơn tốt hơn</option>
                <option value="LOWER_IS_BETTER" className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200">Thấp hơn tốt hơn</option>
                <option value="TARGET_VALUE" className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200">Đúng mục tiêu</option>
              </select>
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
              <select value={formValues.employeeId || ''} onChange={e => setFormValues(prev => ({ ...prev, employeeId: e.target.value }))} className={inputClass}>
                <option value="" className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200">-- Chọn nhân viên --</option>
                {employeesList.map(emp => <option key={emp.id} value={emp.id} className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200">{emp.fullName} ({emp.employeeCode})</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Trạng thái hoạt động *</label>
              <select value={formValues.status || 'ACTIVE'} onChange={e => setFormValues(prev => ({ ...prev, status: e.target.value }))} className={inputClass}>
                <option value="ACTIVE" className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200">Hoạt động</option>
                <option value="INACTIVE" className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200">Không hoạt động</option>
                <option value="LOCKED" className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200">Đã khóa</option>
              </select>
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
