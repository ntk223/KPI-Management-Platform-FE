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
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | ''>('');

  const [modalParentDocId, setModalParentDocId] = useState<number | undefined>(presetParentDocId);
  const [dbParentDocs, setDbParentDocs] = useState<any[]>([]);
  const [parentDocItems, setParentDocItems] = useState<any[]>([]);

  // Dropdown options loaded from backend
  const [dbTemplates, setDbTemplates] = useState<any[]>([]);
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [dbDepartments, setDbDepartments] = useState<any[]>([]);
  const [dbEmployees, setDbEmployees] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  // Flag ngăn các side-effect khác can thiệp trong lúc đang fetch document để edit
  const [isLoadingEdit, setIsLoadingEdit] = useState(false);

  // Sync cycle ID when selectedCycleId changes — chỉ apply khi tạo mới, không ghi đè khi edit
  useEffect(() => {
    if (!editingDocId) {
      setModalCycleId(selectedCycleId);
    }
  }, [selectedCycleId, editingDocId]);

  // Fetch dropdown options when modal is opened
  useEffect(() => {
    if (isOpen) {
      setSelectedCategoryId('');
      setSelectedTemplateId('');

      catalogService.fetchAllForDropdown<any>('/kpi-cycles')
        .then(res => setCycles(res))
        .catch(err => console.error('Error fetching cycles', err));

      catalogService.fetchAllForDropdown<any>('/kpi-templates')
        .then(res => setDbTemplates(res.filter((t: any) => t.isActive !== false)))
        .catch(err => console.error('Error fetching templates', err));

      catalogService.fetchAllForDropdown<any>('/kpi-categories')
        .then(res => setDbCategories(res))
        .catch(err => console.error('Error fetching categories', err));

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
    // Không chạy khi đang tải dữ liệu edit (tránh race condition)
    if (!isOpen || !modalCycleId || isLoadingEdit) return;

    if (modalTargetType === 'COMPANY') {
      setDbParentDocs([]);
      if (!editingDocId) setModalParentDocId(undefined); // Không reset khi đang edit
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
            } else if (!editingDocId) {
              // Chỉ tự động chọn parentDocId khi ở chế độ TẠO MỚI
              // Khi edit, parentDocId được load từ document gốc (trong useEffect dưới)
              const filtered = res.data.filter((doc: any) => {
                if (currentUserRole !== 'MANAGER' || modalTargetType !== 'EMPLOYEE') return true;
                return doc.targetId === user?.department?.id;
              });
              if (filtered.length === 1) {
                setModalParentDocId(filtered[0].id);
              } else if (res.data.length === 1) {
                setModalParentDocId(res.data[0].id);
              }
            }
          }
        })
        .catch(err => console.error('Error fetching parent documents:', err));
    }
  }, [isOpen, modalTargetType, modalCycleId, presetParentDocId, editingDocId, currentUserRole, user, isLoadingEdit]);

  // Fetch items of the selected parent document
  useEffect(() => {
    if (isOpen && modalParentDocId) {
      kpiDocumentService.getById(modalParentDocId)
        .then(res => {
          if (res.success && res.data) {
            setParentDocItems(res.data.kpiItems || []);
          } else {
            setParentDocItems([]);
          }
        })
        .catch(err => {
          console.error('Error fetching parent document items:', err);
          setParentDocItems([]);
        });
    } else {
      setParentDocItems([]);
    }
  }, [isOpen, modalParentDocId]);

  useEffect(() => {
    if (isOpen && editingDocId) {
      setIsLoadingEdit(true); // Block các side-effect khác
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
              documentWeight: item.documentWeight || 0,
              parentWeight: item.parentWeight || 0,
              itemType: item.itemType || 'PERCENTAGE',
              originalItemType: item.originalItemType || null,
              aggregationType: item.aggregationType || null,
              hasChildren: item.hasChildren || false,
              parentId: item.parentId || undefined,
            }));
            setModalItems(items);
            if (items.length > 0) {
              setSelectedItemIndex(0);
            } else {
              setSelectedItemIndex(null);
            }
          }
        })
        .catch(err => console.error('Error fetching document for edit:', err))
        .finally(() => setIsLoadingEdit(false)); // Mở lại side-effects sau khi fetch xong
    } else if (isOpen) {
      // Clear fields for create mode
      const type = presetTargetType || 'DEPARTMENT';
      setModalTargetType(type);
      
      const targetIdVal = presetTargetId || (currentUserRole === 'MANAGER' && type === 'DEPARTMENT' ? user?.department?.id || '' : '');
      setModalTargetId(targetIdVal);
      
      setModalParentDocId(presetParentDocId);
      setModalItems([]);
      setSelectedItemIndex(null);
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
      documentWeight: weightVal,
      parentWeight: 0.1,
      itemType: template.itemType || 'PERCENTAGE',
    };

    setModalItems(prev => {
      const next = [...prev, newItem];
      setSelectedItemIndex(next.length - 1);
      return next;
    });
    setSelectedTemplateId('');
  };

  const handleLoadAllTemplates = () => {
    if (filteredTemplates.length === 0) {
      toast.error('Không có tiêu chí mẫu nào để nạp.');
      return;
    }
    const newItems = filteredTemplates.map(template => {
      const rawWeight = template.defaultWeight ?? 0;
      const weightVal = rawWeight > 1 ? rawWeight / 100 : rawWeight;
      return {
        name: template.name,
        description: template.description || '',
        unit: template.unit || '',
        templateId: template.id,
        targetType: template.targetType === 'LOWER_IS_BETTER' ? 'LOWER_BETTER' : (template.targetType === 'TARGET_VALUE' ? 'EXACT' : 'HIGHER_BETTER'),
        targetValue: 100,
        documentWeight: weightVal,
        parentWeight: 0.1,
        itemType: template.itemType || 'PERCENTAGE',
      };
    });
    setModalItems(newItems);
    if (newItems.length > 0) {
      setSelectedItemIndex(0);
    } else {
      setSelectedItemIndex(null);
    }
  };

  const handleAddCustomItem = () => {
    const newItem = {
      name: '',
      description: '',
      unit: '',
      templateId: undefined,
      targetType: 'HIGHER_BETTER',
      targetValue: 100,
      documentWeight: 0.1,
      parentWeight: 0.1,
      itemType: 'PERCENTAGE' as const,
    };
    setModalItems(prev => {
      const next = [...prev, newItem];
      setSelectedItemIndex(next.length - 1);
      return next;
    });
  };

  const handleRemoveItem = (index: number) => {
    setModalItems(prev => {
      const next = prev.filter((_, i) => i !== index);
      setSelectedItemIndex(oldIdx => {
        if (oldIdx === index) {
          return next.length > 0 ? 0 : null;
        } else if (oldIdx !== null && oldIdx > index) {
          return oldIdx - 1;
        }
        return oldIdx;
      });
      return next;
    });
  };

  const handleItemFieldChange = (index: number, field: string, value: any) => {
    setModalItems(prev => prev.map((item, i) => {
      if (i === index) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const rootWeightSum = useMemo(() => {
    return modalItems
      .filter(item => !item.parentId)
      .reduce((sum, item) => sum + (parseFloat(item.weight as string) || 0), 0);
  }, [modalItems]);


  const hasWeightGreaterThanOne = useMemo(() => {
    return modalItems.some(item => (parseFloat(item.weight as string) || 0) > 1.0);
  }, [modalItems]);

  const filteredTemplates = useMemo(() => {
    if (!selectedCategoryId) return dbTemplates;
    return dbTemplates.filter(t => t.categoryId === selectedCategoryId);
  }, [dbTemplates, selectedCategoryId]);

  const handleSubmitKpiDocument = async (isDraft: boolean) => {
    if (modalTargetType !== 'COMPANY' && !modalTargetId) {
      toast.error('Vui lòng chọn đối tượng nhận KPI.');
      return;
    }
    // if (modalItems.length === 0) {
    //   toast.error('Vui lòng thêm ít nhất một tiêu chí KPI.');
    //   return;
    // }
    if (modalItems.some(item => !item.name.trim())) {
      toast.error('Tên tiêu chí không được để trống.');
      return;
    }
    if (modalItems.some(item => !item.unit.trim())) {
      toast.error('Đơn vị tính không được để trống.');
      return;
    }

    if (!isDraft) {
      const hasRootItems = modalItems.some(item => !item.parentId);
      if (hasRootItems && Math.abs(rootWeightSum - 1.0) > 0.001) {
        toast.error(`Tổng trọng số các tiêu chí gốc phải bằng 100% (Hiện tại là ${(rootWeightSum * 100).toFixed(0)}%)`);
        return;
      }
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
        isDraft: isDraft,
        kpiItems: modalItems.map(item => ({
          id: item.id || undefined,
          name: item.name,
          description: item.description,
          unit: item.unit,
          templateId: item.templateId,
          targetType: item.targetType === 'LOWER_BETTER' ? 'LOWER_BETTER' : (item.targetType === 'EXACT' ? 'EXACT' : 'HIGHER_BETTER'),
          targetValue: Number(item.targetValue) || 0,
          documentWeight: Number(item.documentWeight) || 0,
          parentWeight: Number(item.parentWeight) || 0,
          itemType: item.itemType || 'PERCENTAGE',
          parentId: item.parentId || undefined,
        }))
      };

      const response = await kpiDocumentService.saveOrUpdate(payload);
      if (response.success && response.data) {
        const isPrivilegedRole = currentUserRole === 'DIRECTOR' || currentUserRole === 'MANAGER';
        let successMsg = '';
        if (editingDocId) {
          successMsg = isDraft
            ? 'Cập nhật bản nháp KPI thành công!'
            : 'Cập nhật và gửi duyệt phiếu KPI thành công!';
        } else {
          if (isDraft) {
            successMsg = 'Tạo bản nháp KPI thành công!';
          } else {
            successMsg = isPrivilegedRole
              ? 'Tạo phiếu KPI thành công! Phiếu đã được phê duyệt tự động.'
              : 'Tạo phiếu KPI thành công! Đã gửi duyệt.';
          }
        }
        toast.success(successMsg);
        onClose();
        setModalItems([]);
        if (onSuccess) onSuccess();
      } else {
        toast.error('Lỗi từ máy chủ: ' + response.message);
      }
    } catch (err: any) {
      console.error('Error submitting document', err);
      const errMsg = err?.response?.data?.message || err.message || 'Có lỗi xảy ra khi tạo phiếu KPI.';
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex justify-center items-center p-4 animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-white w-full max-w-6xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-[scaleUp_0.2s_ease-out]">
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
                value={selectedCategoryId}
                onChange={val => {
                  setSelectedCategoryId(val !== '' ? Number(val) : '');
                  setSelectedTemplateId('');
                }}
                options={[
                  { value: '', label: '-- Tất cả danh mục --' },
                  ...dbCategories.map(c => ({ value: c.id, label: c.name }))
                ]}
                className="w-full sm:w-1/3"
              />
              <CustomSelect
                value={selectedTemplateId}
                onChange={val => setSelectedTemplateId(val !== '' ? Number(val) : '')}
                options={[
                  { value: '', label: '-- Chọn mẫu tiêu chí từ thư viện --' },
                  ...filteredTemplates.map(t => ({ value: t.id, label: `${t.name} (${t.unit})` }))
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

          {/* Weight Sum Validation Status Block */}
          {modalItems.length > 0 && modalItems.some(item => !item.parentId) && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
              <div className="font-extrabold text-slate-700 uppercase tracking-wide text-[10px] pb-1 border-b border-slate-200">Trạng thái tổng trọng số đóng góp:</div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-150 max-w-sm">
                <span className="font-semibold text-slate-650">Trọng số cấp phiếu (Gốc):</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${
                  Math.abs(rootWeightSum - 1.0) > 0.001
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  {(rootWeightSum * 100).toFixed(0)}% / 100%
                </span>
              </div>
            </div>
          )}

          {/* Main items split view */}
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Left Pane: Items List (40% width) */}
            <div className="w-full lg:w-[40%] flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs font-bold px-1">
                <span className="text-slate-500">Danh sách tiêu chí ({modalItems.length})</span>
                {modalItems.some(item => !item.parentId) && (
                  <span className={`px-2 py-0.5 rounded text-[10px] border ${
                    Math.abs(rootWeightSum - 1.0) > 0.001 ? 'bg-rose-50 text-rose-750 border-rose-200' : 'bg-emerald-50 text-emerald-750 border-emerald-200'
                  }`}>
                    Gốc: <strong>{(rootWeightSum * 100).toFixed(0)}%</strong>
                  </span>
                )}
              </div>

              {/* Items Card List */}
              <div className="space-y-2.5 max-h-[45vh] overflow-y-auto pr-1">
                {modalItems.map((item, idx) => {
                  const docWeightPercent = (parseFloat(item.documentWeight as string) || 0) * 100;
                  const parentWeightPercent = (parseFloat(item.parentWeight as string) || 0) * 100;
                  const isSelected = selectedItemIndex === idx;
                  // Tìm item cha trong cả parentDocItems (doc cha) lẫn modalItems (cùng doc)
                  const parentItem = item.parentId && (
                    parentDocItems.find(p => p.id === item.parentId) ||
                    modalItems.find(p => p.id === item.parentId)
                  );
                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedItemIndex(idx)}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all duration-200 flex flex-col gap-2 relative ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/20 shadow-sm ring-1 ring-indigo-655'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2 pr-6">
                        <div className="font-extrabold text-slate-800 text-xs line-clamp-2">
                          {item.name ? item.name : <span className="text-slate-400 italic font-medium">(Chưa nhập tên tiêu chí)</span>}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveItem(idx);
                          }}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors absolute right-2 top-2"
                          title="Xóa tiêu chí này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Detail Badges */}
                      <div className="flex flex-wrap gap-1.5 items-center">
                        <span className={`px-1.5 py-0.2 rounded text-[8px] font-extrabold tracking-wide uppercase ${
                          item.hasChildren ? 'bg-purple-100 text-purple-750 border border-purple-200' :
                          item.itemType === 'NUMERIC' ? 'bg-blue-100 text-blue-755 border border-blue-200' :
                          'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {item.hasChildren ? 'Nhóm' : item.itemType === 'NUMERIC' ? 'Số lượng' : 'Tỷ lệ %'}
                        </span>

                        {/* Khi item có con, hiển thị loại tính toán gốc để biết con sẽ kế thừa gì */}
                        {item.hasChildren && item.originalItemType && (
                          <span className={`px-1.5 py-0.2 rounded text-[8px] font-extrabold tracking-wide border ${
                            item.originalItemType === 'NUMERIC'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`} title="Loại tính toán gốc mà các item con sẽ kế thừa">
                            Con kế thừa: {item.originalItemType === 'NUMERIC' ? 'Số lượng' : 'Tỷ lệ %'}
                          </span>
                        )}
                        
                        <span className="bg-slate-50 text-slate-650 border border-slate-200/60 px-1.5 py-0.2 rounded text-[8px] font-extrabold">
                          Gốc: {docWeightPercent.toFixed(0)}%
                        </span>

                        {item.parentId && (
                          <span className="bg-indigo-50 text-indigo-700 border border-indigo-200/60 px-1.5 py-0.2 rounded text-[8px] font-extrabold">
                            Lên cha: {parentWeightPercent.toFixed(0)}%
                          </span>
                        )}

                        {item.unit && (
                          <span className="bg-slate-50 text-slate-600 border border-slate-200/60 px-1.5 py-0.2 rounded text-[8px] font-semibold">
                            Đơn vị: {item.unit}
                          </span>
                        )}
                      </div>

                      {parentItem && (
                        <div className="flex items-center gap-1 text-[8px] text-slate-500 font-semibold bg-slate-50 px-2 py-0.5 rounded border border-slate-150 w-fit">
                          <svg className="w-2.5 h-2.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                          </svg>
                          <span>Cha: {parentItem.name}</span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {modalItems.length === 0 && (
                  <div className="p-8 text-center text-slate-400 italic text-xs border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                    Chưa có tiêu chí nào. Vui lòng bấm các nút trên để thêm.
                  </div>
                )}
              </div>
            </div>

            {/* Right Pane: Selected Item Editor (60% width) */}
            <div className="w-full lg:w-[60%] border border-slate-200 rounded-2xl bg-slate-50/30 p-5 shadow-sm min-h-[35vh]">
              {selectedItemIndex === null || !modalItems[selectedItemIndex] ? (
                <div className="h-full flex flex-col justify-center items-center text-center p-8 text-slate-400 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-700">Chưa chọn tiêu chí</h4>
                  <p className="text-[11px] max-w-xs leading-relaxed">
                    Chọn một tiêu chí từ danh sách bên trái hoặc thêm tiêu chí mới để bắt đầu chỉnh sửa chi tiết.
                  </p>
                </div>
              ) : (
                (() => {
                  const selectedItem = modalItems[selectedItemIndex];
                  const isDocWeightWarn = (parseFloat(selectedItem.documentWeight as string) || 0) > 1.0;
                  const isParentWeightWarn = (parseFloat(selectedItem.parentWeight as string) || 0) > 1.0;
                  return (
                    <div className="space-y-4 text-left animate-[fadeIn_0.15s_ease-out]">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-200/80">
                        <h4 className="text-xs font-extrabold text-indigo-600 flex items-center gap-1.5 uppercase tracking-wide">
                          <span>Chi tiết tiêu chí #{selectedItemIndex + 1}</span>
                          {selectedItem.templateId && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-extrabold bg-indigo-100 text-indigo-800 uppercase border border-indigo-200">
                              Mã mẫu: {selectedItem.templateId}
                            </span>
                          )}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-semibold">Tự động cập nhật</span>
                      </div>

                      {/* Row 1: Name */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Tên tiêu chí <span className="text-rose-500">*</span></label>
                        <input
                          type="text"
                          value={selectedItem.name}
                          placeholder="Nhập tên tiêu chí KPI..."
                          onChange={e => handleItemFieldChange(selectedItemIndex, 'name', e.target.value)}
                          className="w-full border border-slate-200 rounded-xl p-2 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white shadow-sm"
                        />
                      </div>

                      {/* Row 2: Parent selector — hiện khi có parentDoc hoặc có items có con trong cùng doc */}
                      {(() => {
                        // Lấy tất cả item có con (hasChildren=true) trong cùng document (không phải item đang chọn)
                        const sameDocParentCandidates = modalItems.filter((it, i) =>
                          i !== selectedItemIndex && (it.hasChildren === true || it.itemType === 'GROUP')
                        );
                        const allParentOptions = [
                          ...parentDocItems,
                          ...sameDocParentCandidates.filter(c => !parentDocItems.find(p => p.id === c.id))
                        ];
                        // Khi edit: thêm cha hiện tại vào options nếu chưa có (kể cả khi cha không phải GROUP)
                        if (selectedItem.parentId && !allParentOptions.find(p => p.id === selectedItem.parentId)) {
                          const currentParent = modalItems.find(p => p.id === selectedItem.parentId);
                          if (currentParent) allParentOptions.push(currentParent);
                        }
                        if (!modalParentDocId && sameDocParentCandidates.length === 0 && !selectedItem.parentId) return null;
                        return (
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Liên kết tiêu chí cha</label>
                            <select
                              value={selectedItem.parentId || ''}
                              onChange={e => {
                                const val = e.target.value;
                                const pId = val ? Number(val) : undefined;
                                handleItemFieldChange(selectedItemIndex, 'parentId', pId);

                                if (pId) {
                                  // Tìm cha trong cả hai nguồn
                                  const parent = allParentOptions.find(p => p.id === pId);
                                  if (parent) {
                                    // Ưu tiên dùng originalItemType để quyết định kế thừa
                                    const inheritedType = (parent.originalItemType ?? parent.itemType);
                                    if (inheritedType === 'NUMERIC') {
                                      handleItemFieldChange(selectedItemIndex, 'itemType', 'NUMERIC');
                                      handleItemFieldChange(selectedItemIndex, 'unit', parent.unit || '');
                                      handleItemFieldChange(selectedItemIndex, 'targetType', parent.targetType || 'HIGHER_BETTER');
                                      handleItemFieldChange(selectedItemIndex, 'templateId', parent.templateId || undefined);
                                    }
                                    // Nếu cha là PERCENTAGE → không override
                                  }
                                }
                              }}
                              className="w-full border border-slate-200 rounded-xl p-2 text-xs text-slate-850 bg-white font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm"
                            >
                              <option value="">-- Không liên kết --</option>
                              {parentDocItems.length > 0 && (
                                <optgroup label="── Tiêu chí từ phiếu cha ──">
                                  {parentDocItems.map(p => (
                                    <option key={`pdoc-${p.id}`} value={p.id}>
                                      {p.name} ({p.unit})
                                    </option>
                                  ))}
                                </optgroup>
                              )}
                              {sameDocParentCandidates.length > 0 && (
                                <optgroup label="── Tiêu chí nhóm trong phiếu này ──">
                                  {sameDocParentCandidates.map((p, i) => (
                                    <option key={`samedoc-${p.id ?? i}`} value={p.id}>
                                      {p.name} ({p.unit})
                                    </option>
                                  ))}
                                </optgroup>
                              )}
                            </select>
                          </div>
                        );
                      })()}

                      {/* Grid: Unit & Type */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Đơn vị tính <span className="text-rose-500">*</span></label>
                          <input
                            type="text"
                            value={selectedItem.unit}
                            placeholder="VD: VNĐ, %, Điểm"
                            onChange={e => handleItemFieldChange(selectedItemIndex, 'unit', e.target.value)}
                            className="w-full border border-slate-200 rounded-xl p-2 text-xs text-slate-800 text-center font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white shadow-sm"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Loại chỉ số <span className="text-rose-500">*</span></label>
                          <select
                            value={selectedItem.itemType || 'PERCENTAGE'}
                            onChange={e => handleItemFieldChange(selectedItemIndex, 'itemType', e.target.value)}
                            className="w-full border border-slate-200 rounded-xl p-2 text-xs text-slate-800 bg-white font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm"
                          >
                            <option value="PERCENTAGE">Tỷ lệ % (PERCENTAGE)</option>
                            <option value="NUMERIC">Số lượng / Giá trị (NUMERIC)</option>
                          </select>
                        </div>
                      </div>

                      {/* Grid: Target Type, Target Value & Weights */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Xu hướng mục tiêu</label>
                          <select
                            value={selectedItem.targetType}
                            onChange={e => handleItemFieldChange(selectedItemIndex, 'targetType', e.target.value)}
                            className="w-full border border-slate-200 rounded-xl p-2 text-xs text-slate-800 bg-white font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm"
                          >
                            <option value="HIGHER_BETTER">Càng cao tốt hơn</option>
                            <option value="LOWER_BETTER">Càng thấp tốt hơn</option>
                            <option value="EXACT">Chính xác mục tiêu</option>
                          </select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Chỉ tiêu số <span className="text-rose-500">*</span></label>
                          <input
                            type="number"
                            value={selectedItem.targetValue}
                            onChange={e => handleItemFieldChange(selectedItemIndex, 'targetValue', e.target.value)}
                            className="w-full border border-slate-200 rounded-xl p-2 text-xs text-slate-855 text-right focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white shadow-sm font-extrabold"
                          />
                        </div>
                      </div>

                      {/* Row 4: Weights */}
                      <div className={`grid ${selectedItem.parentId ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                        <div className="flex flex-col gap-1.5 relative">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Trọng số gốc (Phiếu) <span className="text-rose-500">*</span></label>
                          <div className="relative">
                            <input
                              type="number"
                              step="0.05"
                              value={selectedItem.documentWeight}
                              onChange={e => handleItemFieldChange(selectedItemIndex, 'documentWeight', e.target.value)}
                              className={`w-full border rounded-xl p-2 text-xs text-center focus:outline-none focus:ring-1 focus:ring-indigo-500 font-extrabold bg-white shadow-sm ${
                                isDocWeightWarn ? 'border-rose-300 bg-rose-50/50 text-rose-800' : 'border-slate-200'
                              }`}
                            />
                            {isDocWeightWarn && (
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-rose-500 flex animate-pulse">
                                <AlertTriangle className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </div>
                        </div>

                        {selectedItem.parentId && (
                          <div className="flex flex-col gap-1.5 relative">
                            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Trọng số đóng góp lên cha <span className="text-rose-500">*</span></label>
                            <div className="relative">
                              <input
                                type="number"
                                step="0.05"
                                value={selectedItem.parentWeight}
                                onChange={e => handleItemFieldChange(selectedItemIndex, 'parentWeight', e.target.value)}
                                className={`w-full border rounded-xl p-2 text-xs text-center focus:outline-none focus:ring-1 focus:ring-indigo-500 font-extrabold bg-white shadow-sm ${
                                  isParentWeightWarn ? 'border-rose-300 bg-rose-50/50 text-rose-800' : 'border-slate-200'
                                }`}
                              />
                              {isParentWeightWarn && (
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-rose-500 flex animate-pulse">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Row 5: Description */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Mô tả tiêu chí</label>
                        <textarea
                          value={selectedItem.description}
                          placeholder="Nhập mô tả chi tiết, hướng dẫn đo lường..."
                          onChange={e => handleItemFieldChange(selectedItemIndex, 'description', e.target.value)}
                          rows={2}
                          className="w-full border border-slate-200 rounded-xl p-2 text-xs text-slate-650 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white shadow-sm resize-none"
                        />
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
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
              onClick={() => handleSubmitKpiDocument(true)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border border-indigo-200 text-indigo-700 hover:bg-indigo-50/50 flex items-center gap-1.5 ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.98]'
              }`}
            >
              Lưu bản nháp
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmitKpiDocument(false)}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 ${
                isSubmitting
                  ? 'bg-slate-400 text-white cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-[0.98]'
              }`}
            >
              {isSubmitting
                ? 'Đang lưu...'
                : editingDocId
                ? (currentUserRole === 'DIRECTOR' || currentUserRole === 'MANAGER' ? 'Lưu & Kích hoạt' : 'Lưu & Gửi duyệt')
                : (currentUserRole === 'DIRECTOR' || currentUserRole === 'MANAGER' ? 'Tạo & Kích hoạt' : 'Tạo & Gửi duyệt')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
