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

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', borderRadius: '8px',
    border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none',
    color: '#334155', boxSizing: 'border-box', marginTop: '6px'
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '12px', fontWeight: 600, color: '#475569'
  };

  const renderFormFields = () => {
    switch (activeTab) {
      case 'positions':
        return (
          <>
            <div>
              <label style={labelStyle}>Mã chức vụ *</label>
              <input type="text" value={formValues.positionCode || ''} onChange={e => setFormValues(prev => ({ ...prev, positionCode: e.target.value }))} placeholder="Ví dụ: GD, TP, NV" style={inputStyle} disabled={!!editingItem} />
            </div>
            <div>
              <label style={labelStyle}>Tên chức danh *</label>
              <input type="text" value={formValues.title || ''} onChange={e => setFormValues(prev => ({ ...prev, title: e.target.value }))} placeholder="Ví dụ: Giám đốc, Trưởng phòng" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Cấp bậc *</label>
              <select value={formValues.level || 1} onChange={e => setFormValues(prev => ({ ...prev, level: Number(e.target.value) }))} style={inputStyle}>
                {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>Cấp {n}</option>)}
              </select>
            </div>
          </>
        );
      case 'departments':
        return (
          <>
            <div>
              <label style={labelStyle}>Mã phòng ban *</label>
              <input type="text" value={formValues.departmentCode || ''} onChange={e => setFormValues(prev => ({ ...prev, departmentCode: e.target.value }))} placeholder="Ví dụ: HR, IT, MKT" style={inputStyle} disabled={!!editingItem} />
            </div>
            <div>
              <label style={labelStyle}>Tên phòng ban *</label>
              <input type="text" value={formValues.name || ''} onChange={e => setFormValues(prev => ({ ...prev, name: e.target.value }))} placeholder="Ví dụ: Phòng Nhân sự" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Phòng ban cha</label>
              <select value={formValues.parentId || ''} onChange={e => setFormValues(prev => ({ ...prev, parentId: e.target.value }))} style={inputStyle}>
                <option value="">Không có (Là phòng ban cấp cao nhất)</option>
                {departmentsList.filter(d => d.id !== editingItem?.id).map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.departmentCode})</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Trưởng phòng</label>
              <select value={formValues.managerId || ''} onChange={e => setFormValues(prev => ({ ...prev, managerId: e.target.value }))} style={inputStyle}>
                <option value="">Không chỉ định</option>
                {employeesList.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.fullName} ({emp.employeeCode})</option>
                ))}
              </select>
            </div>
          </>
        );
      case 'employees':
        return (
          <>
            <div>
              <label style={labelStyle}>Mã nhân viên *</label>
              <input type="text" value={formValues.employeeCode || ''} onChange={e => setFormValues(prev => ({ ...prev, employeeCode: e.target.value }))} placeholder="Ví dụ: NV001" style={inputStyle} disabled={!!editingItem} />
            </div>
            <div>
              <label style={labelStyle}>Họ và tên *</label>
              <input type="text" value={formValues.fullName || ''} onChange={e => setFormValues(prev => ({ ...prev, fullName: e.target.value }))} placeholder="Ví dụ: Nguyễn Văn A" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Email *</label>
              <input type="email" value={formValues.email || ''} onChange={e => setFormValues(prev => ({ ...prev, email: e.target.value }))} placeholder="Ví dụ: anguyen@company.com" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Số điện thoại</label>
              <input type="text" value={formValues.phoneNumber || ''} onChange={e => setFormValues(prev => ({ ...prev, phoneNumber: e.target.value }))} placeholder="Ví dụ: 0912345678" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Phòng ban *</label>
              <select value={formValues.departmentId || ''} onChange={e => setFormValues(prev => ({ ...prev, departmentId: e.target.value }))} style={inputStyle}>
                <option value="">-- Chọn phòng ban --</option>
                {departmentsList.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Chức vụ *</label>
              <select value={formValues.positionId || ''} onChange={e => setFormValues(prev => ({ ...prev, positionId: e.target.value }))} style={inputStyle}>
                <option value="">-- Chọn chức vụ --</option>
                {positionsList.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>
          </>
        );
      case 'cycles':
        return (
          <>
            <div>
              <label style={labelStyle}>Mã chu kỳ *</label>
              <input type="text" value={formValues.cycleCode || ''} onChange={e => setFormValues(prev => ({ ...prev, cycleCode: e.target.value }))} placeholder="Ví dụ: CY2026_Q1" style={inputStyle} disabled={!!editingItem} />
            </div>
            <div>
              <label style={labelStyle}>Tên chu kỳ KPI *</label>
              <input type="text" value={formValues.name || ''} onChange={e => setFormValues(prev => ({ ...prev, name: e.target.value }))} placeholder="Ví dụ: Quý 1 - 2026" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Loại chu kỳ *</label>
              <select value={formValues.type || 'MONTHLY'} onChange={e => setFormValues(prev => ({ ...prev, type: e.target.value }))} style={inputStyle}>
                <option value="MONTHLY">Hàng tháng</option>
                <option value="QUARTERLY">Hàng quý</option>
                <option value="YEARLY">Hàng năm</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Ngày bắt đầu *</label>
              <input type="date" value={formValues.startDate || ''} onChange={e => setFormValues(prev => ({ ...prev, startDate: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Ngày kết thúc *</label>
              <input type="date" value={formValues.endDate || ''} onChange={e => setFormValues(prev => ({ ...prev, endDate: e.target.value }))} style={inputStyle} />
            </div>
          </>
        );
      case 'categories':
        return (
          <>
            <div>
              <label style={labelStyle}>Mã danh mục *</label>
              <input type="text" value={formValues.categoryCode || ''} onChange={e => setFormValues(prev => ({ ...prev, categoryCode: e.target.value }))} placeholder="Ví dụ: FIN, CUS, ENG" style={inputStyle} disabled={!!editingItem} />
            </div>
            <div>
              <label style={labelStyle}>Tên danh mục *</label>
              <input type="text" value={formValues.name || ''} onChange={e => setFormValues(prev => ({ ...prev, name: e.target.value }))} placeholder="Ví dụ: Tài chính, Khách hàng" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Mô tả</label>
              <textarea value={formValues.description || ''} onChange={e => setFormValues(prev => ({ ...prev, description: e.target.value }))} placeholder="Nhập mô tả ngắn..." style={{ ...inputStyle, height: '80px', resize: 'vertical' }} />
            </div>
          </>
        );
      case 'templates':
        return (
          <>
            <div>
              <label style={labelStyle}>Mã tiêu chí mẫu *</label>
              <input type="text" value={formValues.templateCode || ''} onChange={e => setFormValues(prev => ({ ...prev, templateCode: e.target.value }))} placeholder="Ví dụ: REV_01" style={inputStyle} disabled={!!editingItem} />
            </div>
            <div>
              <label style={labelStyle}>Tên tiêu chí *</label>
              <input type="text" value={formValues.name || ''} onChange={e => setFormValues(prev => ({ ...prev, name: e.target.value }))} placeholder="Ví dụ: Đạt doanh số kế hoạch" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Danh mục *</label>
              <select value={formValues.categoryId || ''} onChange={e => setFormValues(prev => ({ ...prev, categoryId: e.target.value }))} style={inputStyle}>
                <option value="">-- Chọn danh mục --</option>
                {categoriesList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Mô tả</label>
              <textarea value={formValues.description || ''} onChange={e => setFormValues(prev => ({ ...prev, description: e.target.value }))} placeholder="Mô tả tiêu chuẩn đạt..." style={{ ...inputStyle, height: '60px', resize: 'vertical' }} />
            </div>
            <div>
              <label style={labelStyle}>Đơn vị tính *</label>
              <input type="text" value={formValues.unit || ''} onChange={e => setFormValues(prev => ({ ...prev, unit: e.target.value }))} placeholder="Ví dụ: VNĐ, %, Lượt, Khách hàng" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Kiểu chỉ tiêu *</label>
              <select value={formValues.targetType || 'HIGHER_IS_BETTER'} onChange={e => setFormValues(prev => ({ ...prev, targetType: e.target.value }))} style={inputStyle}>
                <option value="HIGHER_IS_BETTER">Cao hơn tốt hơn</option>
                <option value="LOWER_IS_BETTER">Thấp hơn tốt hơn</option>
                <option value="TARGET_VALUE">Đúng mục tiêu</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Trọng số mặc định (%) *</label>
              <input type="number" min="0" max="100" value={formValues.defaultWeight !== undefined ? formValues.defaultWeight : 0} onChange={e => setFormValues(prev => ({ ...prev, defaultWeight: Number(e.target.value) }))} style={inputStyle} />
            </div>
          </>
        );
      case 'accounts':
        return (
          <>
            <div>
              <label style={labelStyle}>Tên đăng nhập *</label>
              <input type="text" value={formValues.username || ''} onChange={e => setFormValues(prev => ({ ...prev, username: e.target.value }))} placeholder="Nhập tên đăng nhập" style={inputStyle} disabled={!!editingItem} />
            </div>
            <div>
              <label style={labelStyle}>Mật khẩu {editingItem ? '(Để trống nếu không muốn đổi)' : '*'}</label>
              <input type="password" value={formValues.password || ''} onChange={e => setFormValues(prev => ({ ...prev, password: e.target.value }))} placeholder="Nhập mật khẩu" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Nhân viên liên kết *</label>
              <select value={formValues.employeeId || ''} onChange={e => setFormValues(prev => ({ ...prev, employeeId: e.target.value }))} style={inputStyle}>
                <option value="">-- Chọn nhân viên --</option>
                {employeesList.map(emp => <option key={emp.id} value={emp.id}>{emp.fullName} ({emp.employeeCode})</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Trạng thái hoạt động *</label>
              <select value={formValues.status || 'ACTIVE'} onChange={e => setFormValues(prev => ({ ...prev, status: e.target.value }))} style={inputStyle}>
                <option value="ACTIVE">Hoạt động</option>
                <option value="INACTIVE">Không hoạt động</option>
                <option value="LOCKED">Đã khóa</option>
              </select>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '20px',
      animation: 'fadeIn 0.2s ease'
    }}>
      <div style={{
        background: '#fff', borderRadius: '16px', width: '100%',
        maxWidth: '550px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
        animation: 'scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
      }}>
        {/* Modal header */}
        <div style={{
          padding: '18px 24px', borderBottom: '1px solid #f1f5f9',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)'
        }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
            {editingItem ? 'Cập nhật' : 'Thêm mới'} {tabLabel}
          </h3>
          <button type="button" onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer', color: '#64748b',
            display: 'flex', padding: '4px', borderRadius: '6px', transition: 'background 0.2s'
          }} onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Modal body */}
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ padding: '24px', overflowY: 'auto', maxHeight: '70vh', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {isFetchingOptions ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                <svg style={{ animation: 'spin 1s linear infinite', display: 'block', margin: '0 auto 10px', color: '#6366f1' }} width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                Đang chuẩn bị form...
              </div>
            ) : (
              renderFormFields()
            )}
          </div>

          {/* Modal footer */}
          <div style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '10px', background: '#fafbfc' }}>
            <button type="button" onClick={onClose} style={{
              padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0',
              background: '#fff', color: '#475569', fontSize: '13px', fontWeight: 600, cursor: 'pointer'
            }}>Hủy</button>
            <button type="submit" disabled={isFetchingOptions || isLoading} style={{
              padding: '8px 20px', borderRadius: '8px', border: 'none',
              background: 'linear-gradient(135deg, #6366f1, #0ea5e9)', color: '#fff',
              fontSize: '13px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 10px rgba(99,102,241,0.2)'
            }}>
              Lưu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
