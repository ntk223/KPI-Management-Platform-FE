import React, { useState } from 'react';
import { KpiProvider, useKpi } from '../features/kpi-dashboard';
import { FileText, Upload, ArrowUpRight, User, Clock, FileCheck } from 'lucide-react';

function TrackingLogsInner() {
  const {
    kpiDocuments,
    progressLogs,
    updateKpiDocumentProgress
  } = useKpi();

  // Mock mapped employee ID (ID: 102 for preview)
  const activeEmpId = 102;
  const myDocs = kpiDocuments.filter(d => d.type === 'EMPLOYEE' && d.targetId === activeEmpId);

  // Form states
  const [selectedMyDocId, setSelectedMyDocId] = useState<number>(myDocs[0]?.id || 302);
  const [valueDelta, setValueDelta] = useState<number>(10000000); // default delta for sales
  const [justification, setJustification] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<string>('');

  const handleLogProgressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!justification.trim()) {
      alert('Vui lòng nhập giải trình chi tiết!');
      return;
    }
    updateKpiDocumentProgress(selectedMyDocId, valueDelta, justification.trim(), selectedFile || undefined);
    setJustification('');
    setSelectedFile('');
    alert('Ghi nhận và lưu nhật ký tiến trình KPI thành công!');
  };

  const selectedDoc = myDocs.find(d => d.id === selectedMyDocId);

  return (
    <div className="space-y-6">
      {/* Title Header Banner */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-600" />
          Nhật Ký Tiến Độ Thực Hiện KPIs
        </h2>
        <p className="text-xs text-slate-400 font-semibold mt-1">
          Báo cáo số liệu thực tế, tải lên tệp tin minh chứng và rà soát lịch sử cập nhật
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Logging form */}
        <aside className="lg:col-span-4 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm p-5 space-y-4">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 pb-2 border-b border-slate-100">
            <Clock className="w-4 h-4 text-indigo-600" />
            Ghi nhật ký tiến trình (Log Progress)
          </h3>

          {myDocs.length === 0 ? (
            <p className="text-xs text-slate-400 italic">Bạn chưa được phân bổ KPIs để báo cáo tiến trình.</p>
          ) : (
            <form onSubmit={handleLogProgressSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-slate-400 tracking-wider mb-1.5">Chọn mục tiêu cập nhật</label>
                <select
                  value={selectedMyDocId}
                  onChange={e => setSelectedMyDocId(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-205 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-semibold text-slate-600 bg-slate-50"
                >
                  {myDocs.map(doc => (
                    <option key={doc.id} value={doc.id}>{doc.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase text-slate-400 tracking-wider mb-1.5">Giá trị lũy tiến tăng thêm (Delta)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={valueDelta}
                    onChange={e => setValueDelta(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-205 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-bold text-slate-800 bg-slate-50"
                  />
                  <span className="text-xs font-semibold text-slate-400 whitespace-nowrap bg-slate-100 px-3 py-2 rounded-xl border border-slate-200">
                    đơn vị: {selectedDoc?.unit || 'Lần'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase text-slate-400 tracking-wider mb-1.5">Mô tả & giải trình chi tiết</label>
                <textarea
                  rows={4}
                  required
                  value={justification}
                  onChange={e => setJustification(e.target.value)}
                  placeholder="Nhập chi tiết hoạt động / phụ lục hợp đồng / kết quả..."
                  className="w-full p-3 border border-slate-205 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs text-slate-700 bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase text-slate-400 tracking-wider mb-1.5">Tài liệu / Tệp tin minh chứng</label>
                <div
                  onClick={() => setSelectedFile('VinGroup_Addendum_V3_Signed.pdf')}
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 ${
                    selectedFile
                      ? 'border-indigo-300 bg-indigo-50/20'
                      : 'border-slate-350 hover:border-indigo-400 bg-slate-50/30'
                  }`}
                >
                  <Upload className={`w-5 h-5 ${selectedFile ? 'text-indigo-600 animate-bounce' : 'text-slate-400'}`} />
                  <span className="text-xs font-semibold text-slate-600">
                    {selectedFile ? `Đã đính kèm: ${selectedFile}` : 'Nhấn để đính kèm tệp tin (.pdf, .png)'}
                  </span>
                  <span className="text-[9px] text-slate-400">Dung lượng tối đa 10MB</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all active:scale-[0.98] shadow-md shadow-slate-900/10"
              >
                Ghi nhận tiến trình hoạt động
              </button>
            </form>
          )}
        </aside>

        {/* Right Side: Log history list */}
        <main className="lg:col-span-8 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm p-5 space-y-4">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 pb-2 border-b border-slate-100">
            <Clock className="w-4 h-4 text-indigo-600" />
            Lịch sử nhật ký tiến trình (Progress History Log)
          </h3>

          <div className="flow-root">
            <ul className="-mb-8">
              {progressLogs.map((log, logIdx) => (
                <li key={log.id}>
                  <div className="relative pb-8">
                    {logIdx !== progressLogs.length - 1 ? (
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200" aria-hidden="true" />
                    ) : null}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center ring-8 ring-white text-indigo-600">
                          <ArrowUpRight className="w-4 h-4" />
                        </span>
                      </div>
                      <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                        <div className="text-xs text-slate-650">
                          <div className="font-bold text-slate-800 flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-slate-400" /> {log.employeeName}
                            <span className="font-normal text-slate-500">đã cập nhật chỉ tiêu</span>
                            <span className="text-indigo-600 font-extrabold">{log.docTitle}</span>
                          </div>
                          <p className="mt-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-150 text-[11px] font-medium leading-relaxed italic">
                            "{log.justificationText}"
                          </p>
                          {log.fileName && (
                            <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer">
                              <FileCheck className="w-3 h-3" /> {log.fileName}
                            </span>
                          )}
                        </div>
                        <div className="text-right text-[10px] whitespace-nowrap text-slate-450 font-bold flex flex-col gap-1.5 items-end">
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
                            +{log.valueDelta.toLocaleString()}
                          </span>
                          <time dateTime={log.timestamp} className="text-slate-400 font-semibold block">
                            {new Date(log.timestamp).toLocaleDateString('vi-VN')} {new Date(log.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </time>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </main>
      </div>
    </div>
  );
}

export const TrackingLogsPage: React.FC = () => {
  return (
    <KpiProvider>
      <TrackingLogsInner />
    </KpiProvider>
  );
};
export default TrackingLogsPage;
