import React, { useState, useMemo } from 'react';
import { KpiProvider, useKpi } from '../features/kpi-dashboard';
import { useAuth } from '../features/auth';
import { Target, FileCheck, Send, Award, Calendar } from 'lucide-react';

function KpisPersonalInner() {
  const {
    kpiDocuments,
    cycles,
    submitSelfEvaluation
  } = useKpi();
  const { user } = useAuth();
  
  const [selectedCycleId, setSelectedCycleId] = useState<number>(3); // Q3-2026 is ACTIVE
  const currentDocs = useMemo(() => {
    return kpiDocuments.filter(doc => doc.cycleId === selectedCycleId);
  }, [kpiDocuments, selectedCycleId]);

  const activeCycle = cycles.find(c => c.id === selectedCycleId) || cycles[2];

  // Mock mapping personal employee ID based on user name/role
  // Fallback to employee Lê Thị Sales (ID: 102) for preview
  const activeEmpId = user?.username === 'employee' ? 102 : (user?.username === 'manager' ? 102 : 102);
  const myDocs = currentDocs.filter(d => d.type === 'EMPLOYEE' && d.targetId === activeEmpId);

  const [selfScores, setSelfScores] = useState<Record<number, number>>({});
  const [selfComments, setSelfComments] = useState<Record<number, string>>({});

  const handleSelfEvalSubmit = (docId: number) => {
    const score = selfScores[docId] ?? 90;
    const comment = selfComments[docId] || '';
    submitSelfEvaluation(docId, score, comment);
    alert('Gửi tự chấm điểm và giải trình đánh giá thành công!');
  };

  return (
    <div className="space-y-6">
      {/* Title Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-600" />
            Mục tiêu KPIs & Hiệu Suất Cá Nhân
          </h2>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            Theo dõi tiến trình thực tế, ghi nhận kết quả và thực hiện tự đánh giá cuối chu kỳ
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-lg border border-slate-250">
          <span className="text-[10px] font-bold text-slate-500 uppercase">Chu kỳ:</span>
          <select
            value={selectedCycleId}
            onChange={e => setSelectedCycleId(Number(e.target.value))}
            className="bg-white border border-slate-200 rounded text-xs font-bold p-1 text-slate-700 focus:outline-none"
          >
            {cycles.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column - KPIs Progress Cards */}
        <main className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-bold text-slate-850 text-sm flex items-center gap-1.5 pb-3 border-b border-slate-100 mb-4">
              <Award className="w-4.5 h-4.5 text-indigo-600" />
              Danh sách mục tiêu cá nhân của tôi
            </h3>

            <div className="grid grid-cols-1 gap-4">
              {myDocs.map(doc => {
                let progress = 0;
                if (doc.targetValue > 0) {
                  if (doc.unit === 'ms' || doc.unit === 'Bug') {
                    progress = doc.currentValue <= doc.targetValue ? 100 : Math.round((doc.targetValue / doc.currentValue) * 100);
                  } else {
                    progress = Math.round((doc.currentValue / doc.targetValue) * 100);
                  }
                }
                const clampedProgress = Math.min(100, Math.max(0, progress));

                return (
                  <div key={doc.id} className="p-4 bg-slate-50/50 hover:bg-slate-50 rounded-xl border border-slate-200/70 transition-all space-y-3">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 leading-normal">{doc.title}</h4>
                        <span className="text-[10px] text-slate-400 font-medium">Trọng số: {doc.weight}%</span>
                      </div>
                      <span className={`px-2 py-0.5 text-[8px] font-extrabold uppercase rounded ${
                        doc.status === 'EVALUATED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        doc.status === 'SELF_EVALUATED' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      }`}>
                        {doc.status}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-500">Tiến trình: {doc.currentValue.toLocaleString()} / {doc.targetValue.toLocaleString()} {doc.unit}</span>
                        <span className="text-indigo-600">{clampedProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden shadow-inner">
                        <div
                          className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${clampedProgress}%` }}
                        />
                      </div>
                    </div>

                    {(doc.selfScore || doc.managerScore || doc.finalScore) && (
                      <div className="pt-2 grid grid-cols-3 gap-2 text-[10px] font-bold border-t border-slate-200/50 text-slate-500">
                        <div>
                          TỰ CHẤM: <span className="text-amber-700">{doc.selfScore ?? '—'}</span>
                        </div>
                        <div>
                          QUẢN LÝ CHẤM: <span className="text-slate-700">{doc.managerScore ?? '—'}</span>
                        </div>
                        <div>
                          THỐNG NHẤT: <span className="text-indigo-700">{doc.finalScore ?? '—'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {myDocs.length === 0 && (
                <div className="text-center py-8 text-slate-400 italic">
                  Không có chỉ tiêu cá nhân nào được giao trong chu kỳ này.
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Right Column - Self Evaluation Terminal */}
        <aside className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 pb-3 border-b border-slate-100">
            <FileCheck className="w-4.5 h-4.5 text-amber-500" />
            Cổng tự đánh giá hiệu suất
          </h3>

          {activeCycle.status !== 'EVALUATING' ? (
            <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-xl text-xs text-amber-700 leading-relaxed">
              <Calendar className="w-5 h-5 mb-1.5 text-amber-600" />
              Cổng tự đánh giá hiện tại đang đóng. Tính năng này chỉ mở khi chu kỳ chuyển sang giai đoạn <strong>ĐÁNH GIÁ (EVALUATING)</strong>.
            </div>
          ) : myDocs.length === 0 ? (
            <p className="text-xs text-slate-400 italic">Chưa có chỉ tiêu để đánh giá.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {myDocs.map(doc => {
                const isSubmitted = doc.status === 'SELF_EVALUATED' || doc.status === 'EVALUATED';

                return (
                  <div key={doc.id} className="py-3 first:pt-0 last:pb-0 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-xs text-slate-700 truncate block max-w-[180px]">{doc.title}</span>
                      {isSubmitted && (
                        <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.25 rounded border border-emerald-100">
                          Đã gửi
                        </span>
                      )}
                    </div>

                    {!isSubmitted ? (
                      <div className="space-y-2 pt-1 bg-slate-50/50 p-2.5 rounded-lg border border-slate-150">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-500 uppercase whitespace-nowrap">Tự chấm (1-100):</span>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={selfScores[doc.id] ?? 90}
                            onChange={e => setSelfScores(prev => ({ ...prev, [doc.id]: Number(e.target.value) }))}
                            className="w-14 p-1 border border-slate-200 rounded text-xs font-bold text-center text-slate-800 bg-white"
                          />
                        </div>
                        <input
                          type="text"
                          placeholder="Giải thích ngắn gọn số điểm..."
                          value={selfComments[doc.id] || ''}
                          onChange={e => setSelfComments(prev => ({ ...prev, [doc.id]: e.target.value }))}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs text-slate-700 bg-white"
                        />
                        <button
                          onClick={() => handleSelfEvalSubmit(doc.id)}
                          className="w-full py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded text-xs font-bold transition-all flex items-center justify-center gap-1"
                        >
                          <Send className="w-3 h-3" /> Gửi tự chấm
                        </button>
                      </div>
                    ) : (
                      <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-[11px] text-slate-500 space-y-1">
                        <div>Điểm tự chấm: <strong className="text-slate-700">{doc.selfScore} / 100</strong></div>
                        <div className="italic">Minh chứng: "{doc.proofText || 'Không có giải trình'}"</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export const KpisPersonalPage: React.FC = () => {
  return (
    <KpiProvider>
      <KpisPersonalInner />
    </KpiProvider>
  );
};
export default KpisPersonalPage;
