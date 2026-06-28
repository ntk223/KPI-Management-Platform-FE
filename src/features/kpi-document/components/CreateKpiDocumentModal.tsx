import React, { useState, useEffect, useMemo } from 'react';
import { Sliders, Plus, AlertTriangle, Trash2, ClipboardList } from 'lucide-react';
import { useAuth } from '../../auth';
import { catalogService } from '../../admin-catalog/services/catalogService';
import { kpiDocumentService, KpiDocumentSaveDTO } from '../index';
import { useToast } from '../../../context';
import { CustomSelect } from '../../../components/ui';

interface CreateKpiDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCycleId: number;
  editingDocId?: number;
  presetTargetType?: 'COMPANY' | 'DEPARTMENT' | 'EMPLOYEE';
  presetTargetId?: number;
  presetParentDocId?: number;
  onSuccess?: () => void;
}

export const CreateKpiDocumentModal: React.FC<CreateKpiDocumentModalProps> = ({
  isOpen,
  onClose,
  selectedCycleId,
  editingDocId,
  presetTargetType,
  presetTargetId,
  presetParentDocId,
  onSuccess,
}) => {
  const { user } = useAuth();
  const toast = useToast();
  const currentUserRole = user?.role || 'EMPLOYEE';

  const [cycles, setCycles] = useState<any[]>([]);

  const [modalTargetType, setModalTargetType] = useState<'COMPANY' | 'DEPARTMENT' | 'EMPLOYEE'>('DEPARTMENT');
  const [modalTargetId, setModalTargetId] = useState<number | ''>('');
  const [modalCycleId, setModalCycleId] = useState<number>(selectedCycleId);
  const [modalItems, setModalItems] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | ''>('');

  const [modalParentDocId, setModalParentDocId] = useState<number | undefined>(presetParentDocId);
  const [dbParentDocs, setDbParentDocs] = useState<any[]>([]);

  // Dropdown options loaded from backend
  const [dbTemplates, setDbTemplates] = useState<any[]>([]);
  const [dbDepartments, setDbDepartments] = useState<any[]>([]);
  const [dbEmployees, setDbEmployees] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync cycle ID when selectedCycleId changes
  useEffect(() => {
    setModalCycleId(selectedCycleId);
  }, [selectedCycleId]);

  // Fetch dropdown options when modal is opened
  useEffect(() => {
    if (isOpen) {
      catalogService.fetchAllForDropdown<any>('/kpi-cycles')
        .then(res => setCycles(res))
        .catch(err => console.error('Error fetching cycles', err));

      catalogService.fetchAllForDropdown<any>('/kpi-templates')
        .then(res => setDbTemplates(res.filter((t: any) => t.isActive !== false)))
        .catch(err => console.error('Error fetching templates', err));

      catalogService.fetchAllForDropdown<any>('/departments')
        .then(res => setDbDepartments(res))
        .catch(err => console.error('Error fetching departments', err));
      catalogService.fetchAllForDropdown<any>('/employees')
        .then(res => setDbEmployees(res))
        .catch(err => console.error('Error fetching employees', err));
    }
  }, [isOpen]);

  // Fetch potential parent documents when cycle or target type changes
  useEffect(() => {
    if (!isOpen || !modalCycleId) return;

    if (modalTargetType === 'COMPANY') {
      setDbParentDocs([]);
      setModalParentDocId(undefined);
    } else {
      const parentTargetType = modalTargetType === 'DEPARTMENT' ? 'COMPANY' : 'DEPARTMENT';
      kpiDocumentService.search({
        cycleId: modalCycleId,
        targetType: parentTargetType
      })
        .then(res => {
          if (res.success && res.data) {
            setDbParentDocs(res.data);
            if (presetParentDocId) {
              setModalParentDocId(presetParentDocId);
            } else {
              // For managers, find their own department's KPI document and pre-select it
              const filtered = res.data.filter((doc: any) => {
                if (currentUserRole !== 'MANAGER' || modalTargetType !== 'EMPLOYEE') return true;
                return doc.targetId === user?.department?.id;
              });
              if (!editingDocId && filtered.length === 1) {
                setModalParentDocId(filtered[0].id);
              } else if (!editingDocId && res.data.length === 1) {
                setModalParentDocId(res.data[0].id);
              }
            }
          }
        })
        .catch(err => console.error('Error fetching parent documents:', err));
    }
  }, [isOpen, modalTargetType, modalCycleId, presetParentDocId, editingDocId, currentUserRole, user]);

  useEffect(() => {
    if (isOpen && editingDocId) {
      kpiDocumentService.getById(editingDocId)
        .then(res => {
          if (res.success && res.data) {
            const doc = res.data;
            setModalCycleId(doc.cycleId);
            setModalTargetType(doc.targetType);
            setModalTargetId(doc.targetId || '');
            setModalParentDocId(doc.parentDocId || undefined);
            
            // Map kpiItems to the state structure
            const items = (doc.kpiItems || []).map((item: any) => ({
              id: item.id,
              name: item.name,
              description: item.description || '',
              unit: item.unit || '',
              templateId: item.templateId,
              targetType: item.targetType,
              targetValue: item.targetValue,
              weight: item.weight,
            }));
            setModalItems(items);
          }
        })
        .catch(err => console.error('Error fetching document for edit:', err));
    } else if (isOpen) {
      // Clear fields for create mode
      const type = presetTargetType || 'DEPARTMENT';
      setModalTargetType(type);
      
      const targetIdVal = presetTargetId || (currentUserRole === 'MANAGER' && type === 'DEPARTMENT' ? user?.department?.id || '' : '');
      setModalTargetId(targetIdVal);
      
      setModalParentDocId(presetParentDocId);
      setModalItems([]);
    }
  }, [isOpen, editingDocId, presetTargetType, presetTargetId, presetParentDocId, currentUserRole, user]);

  const handleAddTemplateItem = () => {
    if (!selectedTemplateId) return;
    const template = dbTemplates.find(t => t.id === selectedTemplateId);
    if (!template) return;

    if (modalItems.some(item => item.templateId === template.id)) {
      toast.error('Tiêu chí mẫu này đã được thêm vào danh sách.');
      return;
    }

    const rawWeight = template.defaultWeight ?? 0;
    // Map: If it is a percentage like 30, map to decimal 0.3. If it is 0.3, keep it.
    const weightVal = rawWeight > 1 ? rawWeight / 100 : rawWeight;

    const newItem = {
      name: template.name,
      description: template.description || '',
      unit: template.unit || '',
      templateId: template.id,
      targetType: template.targetType === 'LOWER_IS_BETTER' ? 'LOWER_BETTER' : (template.targetType === 'TARGET_VALUE' ? 'EXACT' : 'HIGHER_BETTER'),
      targetValue: 100,
      weight: weightVal,
    };

    setModalItems(prev => [...prev, newItem]);
    setSelectedTemplateId('');
  };

  const handleLoadAllTemplates = () => {
    if (dbTemplates.length === 0) {
      toast.error('Không có tiêu chí mẫu nào để nạp.');
      return;
    }
    const newItems = dbTemplates.map(template => {
      const rawWeight = template.defaultWeight ?? 0;
      const weightVal = rawWeight > 1 ? rawWeight / 100 : rawWeight;
      return {
        name: template.name,
        description: template.description || '',
        unit: template.unit || '',
        templateId: template.id,
        targetType: template.targetType === 'LOWER_IS_BETTER' ? 'LOWER_BETTER' : (template.targetType === 'TARGET_VALUE' ? 'EXACT' : 'HIGHER_BETTER'),
        targetValue: 100,
        weight: weightVal,
      };
    });
    setModalItems(newItems);
  };

  const handleAddCustomItem = () => {
    const newItem = {
      name: '',
      description: '',
      unit: '',
      templateId: undefined,
      targetType: 'HIGHER_BETTER',
      targetValue: 100,
      weight: 0.1,
    };
    setModalItems(prev => [...prev, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    setModalItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleItemFieldChange = (index: number, field: string, value: any) => {
    setModalItems(prev => prev.map((item, i) => {
      if (i === index) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const sumOfWeights = useMemo(() => {
    return modalItems.reduce((sum, item) => sum + (parseFloat(item.weight) || 0), 0);
  }, [modalItems]);

  const hasWeightGreaterThanOne = useMemo(() => {
    return modalItems.some(item => (parseFloat(item.weight) || 0) > 1.0);
  }, [modalItems]);

  const handleSubmitKpiDocument = async () => {
    if (modalTargetType !== 'COMPANY' && !modalTargetId) {
      toast.error('Vui lòng chọn đối tượng nhận KPI.');
      return;
    }
    if (modalItems.length === 0) {
      toast.error('Vui lòng thêm ít nhất một tiêu chí KPI.');
      return;
    }
    if (modalItems.some(item => !item.name.trim())) {
      toast.error('Tên tiêu chí không được để trống.');
      return;
    }
    if (modalItems.some(item => !item.unit.trim())) {
      toast.error('Đơn vị tính không được để trống.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: KpiDocumentSaveDTO = {
        id: editingDocId || undefined,
        cycleId: modalCycleId,
        targetType: modalTargetType,
        targetId: modalTargetType === 'COMPANY' ? undefined : Number(modalTargetId),
        parentDocId: modalParentDocId || undefined,
        sourceType: 'ASSIGNED',
        kpiItems: modalItems.map(item => ({
          id: item.id || undefined,
          name: item.name,
          description: item.description,
          unit: item.unit,
          templateId: item.templateId,
          targetType: item.targetType === 'LOWER_BETTER' ? 'LOWER_BETTER' : (item.targetType === 'EXACT' ? 'EXACT' : 'HIGHER_BETTER'),
          targetValue: Number(item.targetValue) || 0,
          weight: Number(item.weight) || 0,
        }))
      };

      const response = await kpiDocumentService.saveOrUpdate(payload);
      if (response.success && response.data) {
        const isPrivilegedRole = currentUserRole === 'DIRECTOR' || currentUserRole === 'MANAGER';
        const successMsg = editingDocId
          ? 'Cập nhật phiếu KPI thành công!'
          : isPrivilegedRole
          ? 'Tạo phiếu KPI thành công! Phiếu đã được phê duyệt tự động.'
          : 'Tạo phiếu KPI thành công!';
        toast.success(successMsg);
        onClose();
        setModalItems([]);
        if (onSuccess) onSuccess();
      } else {
        toast.error('Lỗi từ máy chủ: ' + response.message);
      }
    } catch (err: any) {
      console.error('Error submitting document', err);
      const errMsg = err?.response?.data?.message || 'Có lỗi xảy ra khi tạo phiếu KPI.';
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex justify-center items-center p-4 animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-white w-full max-w-5xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-[scaleUp_0.2s_ease-out]">
        {/* Header */}
        <div className="bg-slate-50 p-5 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-650" />
              {editingDocId ? 'Cập Nhật Phiếu Giao KPI' : 'Tạo Phiếu Giao KPI Mới'}
            </h3>
            <p className="text-xs text-slate-400 font-semibold mt-1">
              {editingDocId ? 'Chỉnh sửa chỉ tiêu và danh sách tiêu chí KPI' : 'Thiết lập chu kỳ, đối tượng và danh sách tiêu chí mẫu/tự do'}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content (Scrollable) */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Form Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Cycle Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Chu kỳ đánh giá</label>
              <CustomSelect
                value={modalCycleId}
                onChange={val => setModalCycleId(Number(val))}
                disabled={!!editingDocId}
                options={cycles.map(c => ({ value: c.id, label: c.name }))}
              />
            </div>

            {/* Target Type Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Loại đối tượng nhận KPI</label>
              <CustomSelect
                value={modalTargetType}
                onChange={val => {
                  const newType = val as any;
                  setModalTargetType(newType);
                  if (currentUserRole === 'MANAGER' && newType === 'DEPARTMENT') {
                    setModalTargetId(user?.department?.id || '');
                  } else {
                    setModalTargetId('');
                  }
                }}
                disabled={!!presetTargetId}
                options={[
                  ...((currentUserRole === 'ADMIN' || currentUserRole === 'DIRECTOR') ? [{ value: 'COMPANY', label: 'Cấp Công Ty' }] : []),
                  { value: 'DEPARTMENT', label: 'Cấp Phòng Ban' },
                  { value: 'EMPLOYEE', label: 'Cấp Nhân Viên' }
                ]}
              />
            </div>

            {/* Target Object Selector */}
            {modalTargetType !== 'COMPANY' && (
              <div className="flex flex-col gap-1.5 animate-[fadeIn_0.15s_ease-out]">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {modalTargetType === 'DEPARTMENT' ? 'Chọn phòng ban' : 'Chọn nhân viên'}
                </label>
                <CustomSelect
                  value={modalTargetId}
                  onChange={val => setModalTargetId(val !== '' ? Number(val) : '')}
                  disabled={!!presetTargetId}
                  options={[
                    { value: '', label: '-- Chọn đối tượng --' },
                    ...(modalTargetType === 'DEPARTMENT'
                      ? dbDepartments
                          .filter(d => currentUserRole !== 'MANAGER' || d.id === user?.department?.id)
                          .map(d => ({ value: d.id, label: d.name }))
                      : dbEmployees
                          .filter(emp => {
                            if (currentUserRole !== 'MANAGER') return true;
                            return emp.departmentId === user?.department?.id && emp.id !== user?.employeeId;
                          })
                          .map(emp => ({ value: emp.id, label: `${emp.fullName} (${emp.positionTitle || 'Nhân viên'})` }))
                    )
                  ]}
                />
              </div>
            )}

            {/* Parent Document Selector */}
            {modalTargetType !== 'COMPANY' && dbParentDocs.length > 0 && (
              <div className="flex flex-col gap-1.5 animate-[fadeIn_0.15s_ease-out]">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Tài liệu KPI cha (Phân rã)
                </label>
                <CustomSelect
                  value={modalParentDocId || ''}
                  onChange={val => setModalParentDocId(val !== '' ? Number(val) : undefined)}
                  options={[
                    { value: '', label: '-- Không liên kết --' },
                    ...dbParentDocs
                      .filter(doc => {
                        if (currentUserRole !== 'MANAGER' || modalTargetType !== 'EMPLOYEE') return true;
                        return doc.targetId === user?.department?.id;
                      })
                      .map(doc => ({ value: doc.id, label: `${doc.documentCode} - ${doc.targetName}` }))
                  ]}
                />
              </div>
            )}
          </div>

          {/* Template Selector Section */}
          <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200 space-y-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Chọn tiêu chí mẫu để thêm</span>
            <div className="flex flex-col sm:flex-row gap-2">
              <CustomSelect
                value={selectedTemplateId}
                onChange={val => setSelectedTemplateId(val !== '' ? Number(val) : '')}
                options={[
                  { value: '', label: '-- Chọn mẫu tiêu chí từ thư viện --' },
                  ...dbTemplates.map(t => ({ value: t.id, label: `${t.name} (${t.unit})` }))
                ]}
                className="flex-1"
              />
              <button
                type="button"
                onClick={handleAddTemplateItem}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm mẫu
              </button>
              <button
                type="button"
                onClick={handleLoadAllTemplates}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1"
                title="Nạp tất cả tiêu chí mẫu hiện có"
              >
                <ClipboardList className="w-3.5 h-3.5" /> Nạp tất cả mẫu
              </button>
              <button
                type="button"
                onClick={handleAddCustomItem}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 border border-slate-800"
              >
                <Plus className="w-3.5 h-3.5" /> + Tiêu chí tự do
              </button>
            </div>
          </div>

          {/* Weight Alerts Block */}
          {hasWeightGreaterThanOne && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3.5 text-xs flex items-start gap-2.5 animate-[fadeIn_0.2s_ease-out]">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold block">Chú ý về Trọng số:</span>
                Hệ thống nhận thấy có chỉ số trọng số lớn hơn 1.0 (ví dụ: 20 hoặc 50). Trọng số nên ở dạng số thập phân từ 0 đến 1.0 (ví dụ: 0.2 tương ứng với 20%, 0.5 tương ứng với 50%) để tính toán chính xác tổng là 1.0 (100%). Vui lòng kiểm tra lại.
              </div>
            </div>
          )}

          {modalItems.length > 0 && (
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-500">Số tiêu chí đã chọn: <strong className="text-slate-800">{modalItems.length}</strong></span>
              <span className={`px-2 py-1 rounded border ${
                sumOfWeights > 1.0 ? 'bg-rose-50 text-rose-700 border-rose-200' :
                sumOfWeights === 1.0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                Tổng trọng số: <strong className="text-sm">{(sumOfWeights * 100).toFixed(0)}%</strong> ({sumOfWeights.toFixed(2)} / 1.0)
              </span>
            </div>
          )}

          {/* Items List Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider w-1/3">Tên tiêu chí</th>
                  <th scope="col" className="px-3 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider w-12">Đơn vị</th>
                  <th scope="col" className="px-3 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Mục tiêu</th>
                  <th scope="col" className="px-3 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider w-24">Chỉ tiêu</th>
                  <th scope="col" className="px-3 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider w-20">Trọng số</th>
                  <th scope="col" className="px-3 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Mô tả</th>
                  <th scope="col" className="px-3 py-3 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider w-10"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {modalItems.map((item, idx) => {
                  const isWeightWarn = (parseFloat(item.weight) || 0) > 1.0;
                  return (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={item.name}
                          placeholder="Nhập tên tiêu chí..."
                          onChange={e => handleItemFieldChange(idx, 'name', e.target.value)}
                          className="w-full border border-slate-200 rounded-lg p-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        {item.templateId && (
                          <span className="inline-block mt-1 text-[8px] font-extrabold uppercase bg-indigo-50 text-indigo-700 px-1 py-0.2 rounded border border-indigo-200">
                            Mẫu #{item.templateId}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <input
                          type="text"
                          value={item.unit}
                          placeholder="VD: VNĐ, %"
                          onChange={e => handleItemFieldChange(idx, 'unit', e.target.value)}
                          className="w-full border border-slate-200 rounded-lg p-1.5 text-xs text-slate-800 text-center focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <select
                          value={item.targetType}
                          onChange={e => handleItemFieldChange(idx, 'targetType', e.target.value)}
                          className="border border-slate-200 rounded-lg p-1.5 text-xs text-slate-700 bg-white font-medium focus:outline-none"
                        >
                          <option value="HIGHER_BETTER">Càng cao tốt hơn</option>
                          <option value="LOWER_BETTER">Càng thấp tốt hơn</option>
                          <option value="EXACT">Chính xác mục tiêu</option>
                        </select>
                      </td>
                      <td className="px-3 py-3">
                        <input
                          type="number"
                          value={item.targetValue}
                          onChange={e => handleItemFieldChange(idx, 'targetValue', e.target.value)}
                          className="w-full border border-slate-200 rounded-lg p-1.5 text-xs text-slate-800 text-right focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <div className="relative flex items-center">
                          <input
                            type="number"
                            step="0.05"
                            value={item.weight}
                            onChange={e => handleItemFieldChange(idx, 'weight', e.target.value)}
                            className={`w-full border rounded-lg p-1.5 text-xs text-center focus:outline-none focus:ring-1 font-extrabold ${
                              isWeightWarn ? 'border-rose-350 bg-rose-50/50 text-rose-800 focus:ring-rose-500 animate-[fadeIn_0.2s_ease-out]' : 'border-slate-200 text-slate-800 focus:ring-indigo-500'
                            }`}
                          />
                          {isWeightWarn && (
                            <span className="absolute -right-2 top-1/2 -translate-y-1/2 text-rose-500 flex animate-pulse">
                              <AlertTriangle className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <input
                          type="text"
                          value={item.description}
                          placeholder="Mô tả tiêu chí..."
                          onChange={e => handleItemFieldChange(idx, 'description', e.target.value)}
                          className="w-full border border-slate-200 rounded-lg p-1.5 text-xs text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {modalItems.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400 italic text-xs">
                      Chưa có tiêu chí nào. Vui lòng chọn tiêu chí mẫu hoặc thêm tiêu chí tự do bên trên.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-between items-center">
          <div className="text-[10px] text-slate-400 font-semibold">
            {(currentUserRole === 'DIRECTOR' || currentUserRole === 'MANAGER')
              ? <span>* Phiếu sẽ được <strong className="text-emerald-600">PHÊ DUYỆT TỰ ĐỘNG</strong> vì bạn có quyền Giám đốc / Quản lý.</span>
              : <span>* Phiếu mới được tạo mặc định ở trạng thái <strong>NHÁP (DRAFT)</strong>.</span>
            }
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmitKpiDocument}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 ${
                isSubmitting
                  ? 'bg-slate-400 text-white cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-[0.98]'
              }`}
            >
              {isSubmitting ? 'Đang tạo...' : 'Lưu và Khởi tạo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
