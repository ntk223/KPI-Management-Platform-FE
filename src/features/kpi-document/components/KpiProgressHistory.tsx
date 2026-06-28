import React, { useState, useEffect, useCallback } from 'react';
import { Clock, ArrowUpRight, ArrowDownRight, MessageSquare, Loader2, RefreshCw } from 'lucide-react';
import { kpiTrackingService, KpiTrackingLogResponse } from '../services/kpiTrackingService';

interface KpiProgressHistoryProps {
  kpiItemId: number;
  unit?: string;
}

export const KpiProgressHistory: React.FC<KpiProgressHistoryProps> = ({ kpiItemId, unit = '' }) => {
  const [history, setHistory] = useState<KpiTrackingLogResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await kpiTrackingService.getHistory(kpiItemId);
      if (res.success && res.data) {
        setHistory(res.data);
      } else {
        setError(res.message || 'Không thể lấy lịch sử cập nhật.');
      }
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra khi kết nối máy chủ.');
    } finally {
      setIsLoading(false);
    }
  }, [kpiItemId]);

  useEffect(() => {
    if (kpiItemId) {
      fetchHistory();
    }
  }, [kpiItemId, fetchHistory]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6 gap-2 text-slate-400 text-xs">
        <Loader2 className="w-4 h-4 animate-spin" />
        Đang tải lịch sử tiến độ...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 text-xs text-rose-600 bg-rose-50 rounded-xl border border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/50 flex justify-between items-center">
        <span>{error}</span>
        <button onClick={fetchHistory} className="p-1 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-6 text-xs text-slate-400 dark:text-zinc-500 italic">
        Chưa có lịch sử cập nhật tiến độ cho tiêu chí này.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wide">
            Nhật ký cập nhật tiến độ
          </span>
        </div>
        <button
          onClick={fetchHistory}
          className="text-slate-400 hover:text-indigo-600 p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded transition-colors"
          title="Tải lại"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Timeline List */}
      <div className="relative border-l border-slate-200 dark:border-zinc-850 ml-2.5 pl-4 space-y-4">
        {history.map((log) => {
          const isUp = log.valueDelta >= 0;
          return (
            <div key={log.id} className="relative">
              {/* Status dot icon */}
              <span className={`absolute -left-[24.5px] top-0.5 w-4 h-4 rounded-full flex items-center justify-center shadow border ${
                isUp
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-900/60 dark:text-emerald-450'
                  : 'bg-rose-50 border-rose-200 text-rose-650 dark:bg-rose-950/20 dark:border-rose-900/60 dark:text-rose-450'
              }`}>
                {isUp ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
              </span>

              {/* Log details */}
              <div className="space-y-1.5 bg-slate-50/50 hover:bg-slate-50 dark:bg-zinc-900/50 dark:hover:bg-zinc-900 p-3 rounded-xl border border-slate-150 dark:border-zinc-850 transition-colors">
                <div className="flex justify-between items-start gap-4">
                  <div className="text-xs font-bold text-slate-700 dark:text-zinc-200">
                    {log.valueBefore} → {log.valueAfter} <span className="text-[10px] text-slate-450 dark:text-zinc-450 font-medium">({unit})</span>
                  </div>
                  <div className={`text-[10px] font-extrabold ${isUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {isUp ? '+' : ''}{log.valueDelta.toLocaleString()}
                  </div>
                </div>

                {log.notes && (
                  <div className="flex gap-1.5 items-start text-[11px] text-slate-505 dark:text-zinc-400 font-medium bg-white dark:bg-zinc-850 p-2 rounded-lg border border-slate-100 dark:border-zinc-800">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                    <p className="leading-normal">{log.notes}</p>
                  </div>
                )}

                <div className="flex justify-between items-center text-[9px] text-slate-400 dark:text-zinc-500 font-semibold pt-1 border-t border-slate-100/50 dark:border-zinc-800/50">
                  <span>Người cập nhật: {log.reporterName || 'Nhân sự'}</span>
                  <span>{new Date(log.createdAt).toLocaleString('vi-VN')}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
