import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../features/auth';
import { catalogService } from '../features/admin-catalog/services/catalogService';
import { 
  kpiDocumentService, 
  KpiPersonalProgressForm, 
  KpiAttachmentUploader 
} from '../features/kpi-document';
import { kpiTrackingService } from '../features/kpi-document/services/kpiTrackingService';
import { 
  FileText, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight, 
  Loader2, 
  RefreshCw, 
  Calendar, 
  Paperclip,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { CustomSelect } from '../components/ui';

export const TrackingLogsPage: React.FC = () => {
  const { user } = useAuth();

  const [cycles, setCycles] = useState<any[]>([]);
  const [selectedCycleId, setSelectedCycleId] = useState<number | ''>('');
  const [myDoc, setMyDoc] = useState<any | null>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null);

  // Load KPI cycles on mount
  const loadCycles = async () => {
    try {
      const res = await catalogService.fetchAllForDropdown('kpi-cycles');
      if (res && res.length > 0) {
        setCycles(res);
        const activeCycle = res.find((c: any) => c.status === 'ACTIVE');
        if (activeCycle) {
          setSelectedCycleId(activeCycle.id);
        } else {
          setSelectedCycleId(res[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load cycles', err);
    }
  };

  useEffect(() => {
    loadCycles();
  }, []);

  // Fetch personal KPI doc
  const loadMyDoc = useCallback(async (cycleId: number) => {
    if (!user?.employeeId) return;
    setIsLoading(true);
    try {
      const res = await kpiDocumentService.search({
        cycleId,
        targetType: 'EMPLOYEE',
        targetId: user.employeeId
      });
      if (res.success && res.data && res.data.length > 0) {
        setMyDoc(res.data[0]);
      } else {
        setMyDoc(null);
      }
    } catch (err) {
      console.error('Error loading KPI document:', err);
      setMyDoc(null);
    } finally {
      setIsLoading(false);
    }
  }, [user?.employeeId]);

  // Fetch recent logs
  const loadRecentLogs = useCallback(async () => {
    if (!user?.employeeId) return;
    setIsLoadingLogs(true);
    try {
      const res = await kpiTrackingService.getRecentLogs(user.employeeId, undefined, 50);
      if (res.success && res.data) {
        setRecentLogs(res.data);
      }
    } catch (err) {
      console.error('Error loading recent logs:', err);
    } finally {
      setIsLoadingLogs(false);
    }
  }, [user?.employeeId]);

  // Sync data when cycle changes
  useEffect(() => {
    if (selectedCycleId && user?.employeeId) {
      loadMyDoc(Number(selectedCycleId));
      loadRecentLogs();
    }
  }, [selectedCycleId, user?.employeeId, loadMyDoc, loadRecentLogs]);

  // Callback when a new log entry is successfully submitted
  const handleLogSuccess = async () => {
    if (selectedCycleId) {
      await loadMyDoc(Number(selectedCycleId));
    }
    await loadRecentLogs();
  };

  return (
    <div className="space-y-6">
      {/* Title Header Banner */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-zinc-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-650" />
            Nhật Ký Tiến Độ Thực Hiện KPIs
          </h2>
          <p className="text-xs text-slate-400 dark:text-zinc-550 font-semibold mt-1">
            Báo cáo số liệu thực tế, tải lên tệp tin minh chứng và rà soát lịch sử cập nhật
          </p>
        </div>

        {/* Cycle Selector */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-lg border border-slate-250 dark:bg-zinc-800 dark:border-zinc-700">
          <Calendar className="w-4 h-4 text-slate-450 dark:text-zinc-400" />
          <span className="text-[10px] font-bold text-slate-500 uppercase px-1 dark:text-zinc-400">Chu kỳ:</span>
          <CustomSelect
            value={selectedCycleId}
            onChange={val => setSelectedCycleId(val ? Number(val) : '')}
            options={[
              { value: '', label: '-- Chọn chu kỳ --' },
              ...cycles.map(c => ({
                value: c.id,
                label: `${c.name} ${c.status === 'ACTIVE' ? '(Hiện tại)' : ''}`
              }))
            ]}
            className="w-56"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Logging form */}
        <aside className="lg:col-span-5 space-y-4">
          {isLoading ? (
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm p-8 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-650" />
              <span className="text-xs">Đang tải phiếu KPI cá nhân...</span>
            </div>
          ) : myDoc ? (
            <KpiPersonalProgressForm
              kpiItems={myDoc.kpiItems || []}
              employeeId={user?.employeeId || 0}
              onSuccess={handleLogSuccess}
            />
          ) : (
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm p-8 text-center text-slate-400 italic text-xs">
              Không tìm thấy phiếu KPI cá nhân hoạt động trong chu kỳ được chọn.
            </div>
          )}
        </aside>

        {/* Right Side: Log history list */}
        <main className="lg:col-span-7 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
            <h3 className="font-bold text-slate-800 dark:text-zinc-200 text-sm flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-650" />
              Lịch sử nhật ký tiến trình (Progress History Log)
            </h3>
            <button
              onClick={loadRecentLogs}
              disabled={isLoadingLogs}
              className="p-1.5 text-slate-400 hover:text-indigo-650 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-bold"
              title="Làm mới lịch sử"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLogs ? 'animate-spin' : ''}`} />
              Tải lại
            </button>
          </div>

          {isLoadingLogs ? (
            <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-650" />
              <span className="text-xs">Đang tải lịch sử cập nhật...</span>
            </div>
          ) : recentLogs.length > 0 ? (
            <div className="flow-root">
              <ul className="-mb-8">
                {recentLogs.map((log, logIdx) => {
                  const isUp = log.valueDelta >= 0;
                  const isExpanded = expandedLogId === log.id;
                  const itemName = log.kpiItemName || log.kpiItem?.name || `Tiêu chí #${log.kpiItemId}`;
                  const unit = log.unit || log.kpiItem?.unit || '';

                  return (
                    <li key={log.id}>
                      <div className="relative pb-8">
                        {logIdx !== recentLogs.length - 1 ? (
                          <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200 dark:bg-zinc-800" aria-hidden="true" />
                        ) : null}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white dark:ring-zinc-900 ${
                              isUp 
                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30' 
                                : 'bg-rose-50 text-rose-600 dark:bg-rose-950/30'
                            }`}>
                              {isUp ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0 pt-1.5 flex flex-col gap-2">
                            <div className="flex justify-between items-start gap-4">
                              <div className="text-xs text-slate-650 dark:text-zinc-400">
                                <div className="font-bold text-slate-800 dark:text-zinc-200">
                                  {itemName}
                                </div>
                                <div className="text-[10px] text-slate-400 mt-0.5">
                                  Giá trị thay đổi: <span className="font-semibold text-slate-600 dark:text-zinc-300">{Number(log.valueBefore).toLocaleString()}</span> → <span className="font-bold text-indigo-650 dark:text-indigo-400">{Number(log.valueAfter).toLocaleString()}</span> {unit}
                                </div>
                              </div>
                              <div className="text-right text-[10px] whitespace-nowrap text-slate-450 font-bold flex flex-col gap-1 items-end">
                                <span className={`px-2 py-0.5 rounded-full border ${
                                  isUp 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-450 dark:border-emerald-900/60' 
                                    : 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/40 dark:text-rose-455 dark:border-rose-900/60'
                                }`}>
                                  {isUp ? '+' : ''}{Number(log.valueDelta).toLocaleString()}
                                </span>
                                <span className="text-slate-400 text-[9px] font-medium block">
                                  {new Date(log.createdAt).toLocaleDateString('vi-VN')} {new Date(log.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>

                            {log.notes && (
                              <p className="bg-slate-50 dark:bg-zinc-850 p-2.5 rounded-lg border border-slate-150 dark:border-zinc-800 text-[11px] font-medium leading-relaxed italic text-slate-600 dark:text-zinc-400">
                                "{log.notes}"
                              </p>
                            )}

                            {/* Collapse/Expand attachments */}
                            <div className="mt-1">
                              <button
                                onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-650 hover:text-indigo-850 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                              >
                                <Paperclip className="w-3 h-3" />
                                {isExpanded ? 'Ẩn tài liệu minh chứng' : 'Xem tài liệu minh chứng'}
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>

                              {isExpanded && (
                                <div className="mt-2 p-3 bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 rounded-xl animate-[fadeIn_0.15s_ease-out]">
                                  <KpiAttachmentUploader
                                    kpiItemId={log.kpiItemId}
                                    readOnly={true}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 italic text-xs">
              Chưa có nhật ký cập nhật tiến độ nào trong chu kỳ này.
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default TrackingLogsPage;
