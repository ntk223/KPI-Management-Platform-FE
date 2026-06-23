import React, { useState, useEffect } from 'react';
import { useKpi } from '../context/KpiContext';
import { CycleStatus } from '../data/mockData';
import { RefreshCw, Layers, Plus, Trash2, ShieldAlert } from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const {
    cycles,
    positions,
    kpiTemplates,
    positionBundles,
    transitionCycleState,
    savePositionBundle
  } = useKpi();

  const [selectedPositionId, setSelectedPositionId] = useState<number>(positions[0]?.id || 1);
  const [bundleRows, setBundleRows] = useState<{ templateId: number; defaultWeight: number }[]>([]);

  // Load existing bundles for selected position
  useEffect(() => {
    const existing = positionBundles.filter(pb => pb.positionId === selectedPositionId);
    setBundleRows(existing.map(pb => ({ templateId: pb.templateId, defaultWeight: pb.defaultWeight })));
  }, [selectedPositionId, positionBundles]);

  const totalWeight = bundleRows.reduce((sum, row) => sum + row.defaultWeight, 0);
  const isWeightValid = totalWeight === 100;

  const handleAddTemplateRow = () => {
    // Find first template that is not already in the bundle
    const unusedTemplate = kpiTemplates.find(t => !bundleRows.some(row => row.templateId === t.id));
    if (unusedTemplate) {
      setBundleRows(prev => [...prev, { templateId: unusedTemplate.id, defaultWeight: 10 }]);
    } else {
      setBundleRows(prev => [...prev, { templateId: kpiTemplates[0].id, defaultWeight: 10 }]);
    }
  };

  const handleRemoveRow = (index: number) => {
    setBundleRows(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleRowChange = (index: number, field: 'templateId' | 'defaultWeight', value: number) => {
    setBundleRows(prev =>
      prev.map((row, idx) => (idx === index ? { ...row, [field]: value } : row))
    );
  };

  const handleSaveBundle = () => {
    if (!isWeightValid) return;
    savePositionBundle(selectedPositionId, bundleRows);
    alert('Cấu hình định mức chức vụ thành công!');
  };

  // Cycle Status styling maps
  const cycleStatusColor: Record<CycleStatus, string> = {
    PLANNING: 'bg-slate-100 text-slate-700 border-slate-200',
    ACTIVE: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    EVALUATING: 'bg-amber-50 text-amber-700 border-amber-200',
    CLOSED: 'bg-slate-200 text-slate-600 border-slate-300',
  };

  const cycleStatusText: Record<CycleStatus, string> = {
    PLANNING: 'Lập kế hoạch',
    ACTIVE: 'Đang hoạt động',
    EVALUATING: 'Đang đánh giá',
    CLOSED: 'Đã kết thúc',
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* ── Cycle Management ── */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-indigo-600 animate-spin-slow" />
            Quản lý chu kỳ đánh giá KPI
          </h2>
          <span className="text-xs font-semibold text-slate-400">Thiết lập trạng thái hệ thống</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 font-bold text-slate-600">ID</th>
                <th className="p-4 font-bold text-slate-600">Tên chu kỳ</th>
                <th className="p-4 font-bold text-slate-600">Trạng thái hiện tại</th>
                <th className="p-4 font-bold text-slate-600 text-right">Thao tác trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {cycles.map(c => (
                <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-all">
                  <td className="p-4 font-medium text-slate-500">{c.id}</td>
                  <td className="p-4 font-bold text-slate-800">{c.name}</td>
                  <td className="p-4">
                    <span className={`inline-flex px-2.5 py-0.5 text-xs font-bold rounded-full border ${cycleStatusColor[c.status]}`}>
                      {cycleStatusText[c.status]}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="inline-flex gap-2">
                      {c.status === 'PLANNING' && (
                        <button
                          onClick={() => transitionCycleState(c.id, 'ACTIVE')}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm shadow-indigo-600/10"
                        >
                          Kích hoạt chu kỳ
                        </button>
                      )}
                      {c.status === 'ACTIVE' && (
                        <button
                          onClick={() => transitionCycleState(c.id, 'EVALUATING')}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-all shadow-sm shadow-amber-500/10"
                        >
                          Mở cổng đánh giá
                        </button>
                      )}
                      {c.status === 'EVALUATING' && (
                        <button
                          onClick={() => transitionCycleState(c.id, 'CLOSED')}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-all"
                        >
                          Đóng cổng / Kết thúc
                        </button>
                      )}
                      {c.status === 'CLOSED' && (
                        <span className="text-xs font-medium text-slate-400 italic">Chu kỳ đã hoàn thành</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Position Bundle Configuration ── */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            Cấu hình định mức trọng số chức vụ (Position KPI Bundles)
          </h2>
          <span className="text-xs font-semibold text-slate-400">Bản đồ liên kết chức vụ - chỉ tiêu</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Select position panel */}
          <div className="lg:col-span-4 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Chọn chức vụ cần cấu hình</label>
              <div className="space-y-2">
                {positions.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPositionId(p.id)}
                    className={`w-full p-4 rounded-xl text-left border font-semibold text-sm transition-all flex justify-between items-center ${
                      selectedPositionId === p.id
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-900 ring-2 ring-indigo-100'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{p.name}</span>
                    <code className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{p.code}</code>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Matrix Weight Assign panel */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold uppercase text-slate-500">Danh sách KPI thuộc Chức vụ</h3>
              <button
                onClick={handleAddTemplateRow}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-200 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm chỉ tiêu mẫu
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200">
                    <th className="p-3 font-bold text-slate-600">Tên KPI mẫu</th>
                    <th className="p-3 font-bold text-slate-600">Đơn vị</th>
                    <th className="p-3 font-bold text-slate-600 w-24">Trọng số (%)</th>
                    <th className="p-3 font-bold text-slate-600 text-center w-16">Xóa</th>
                  </tr>
                </thead>
                <tbody>
                  {bundleRows.map((row, index) => {
                    const template = kpiTemplates.find(t => t.id === row.templateId);
                    return (
                      <tr key={index} className="border-b border-slate-200 bg-white">
                        <td className="p-3">
                          <select
                            value={row.templateId}
                            onChange={e => handleRowChange(index, 'templateId', Number(e.target.value))}
                            className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-semibold text-slate-700"
                          >
                            {kpiTemplates.map(t => (
                              <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3 text-slate-500 font-semibold">{template?.unit}</td>
                        <td className="p-3">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={row.defaultWeight}
                            onChange={e => handleRowChange(index, 'defaultWeight', Number(e.target.value))}
                            className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-bold text-slate-800 text-center"
                          />
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleRemoveRow(index)}
                            className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {bundleRows.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-400 italic">
                        Chưa thiết lập chỉ tiêu cho chức vụ này. Hãy thêm mới chỉ tiêu mẫu!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Summary and Validation footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Tổng trọng số:</span>
                  <span className={`text-base font-extrabold px-2.5 py-0.5 rounded-lg border ${
                    isWeightValid
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : 'bg-rose-50 border-rose-200 text-rose-700'
                  }`}>
                    {totalWeight}%
                  </span>
                </div>

                {!isWeightValid && (
                  <div className="flex items-center gap-1.5 text-rose-600 text-xs font-bold bg-white px-3 py-1.5 rounded-lg border border-rose-100 shadow-sm animate-pulse">
                    <ShieldAlert className="w-4 h-4" />
                    Tổng trọng số các chỉ tiêu phải đạt chính xác 100%
                  </div>
                )}

                <button
                  onClick={handleSaveBundle}
                  disabled={!isWeightValid || bundleRows.length === 0}
                  className={`px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
                    isWeightValid && bundleRows.length > 0
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/10 active:scale-[0.98]'
                      : 'bg-slate-200 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none'
                  }`}
                >
                  Lưu cấu hình định mức
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
