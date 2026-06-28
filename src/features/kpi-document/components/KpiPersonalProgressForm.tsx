import React, { useState, useEffect, useRef } from 'react';
import { Target, Plus, Paperclip, Trash2, Loader2, CheckCircle2 } from 'lucide-react';
import { kpiTrackingService } from '../services/kpiTrackingService';
import { kpiAttachmentService } from '../services/kpiAttachmentService';
import { useToast } from '../../../context';
import { CustomSelect } from '../../../components/ui';

interface KpiPersonalProgressFormProps {
  kpiItems: any[];
  employeeId: number;
  onSuccess: () => Promise<any> | void;
}

export const KpiPersonalProgressForm: React.FC<KpiPersonalProgressFormProps> = ({
  kpiItems,
  employeeId,
  onSuccess
}) => {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedItemId, setSelectedItemId] = useState<number | ''>('');
  const [currentValueVal, setCurrentValueVal] = useState<string>('');
  const [notesVal, setNotesVal] = useState<string>('');
  const [queuedFiles, setQueuedFiles] = useState<File[]>([]);
  const [isSubmittingProgress, setIsSubmittingProgress] = useState(false);

  // Sync selected KPI item when kpiItems loads
  useEffect(() => {
    if (kpiItems && kpiItems.length > 0) {
      const exists = kpiItems.some((item: any) => item.id === selectedItemId);
      if (!exists) {
        setSelectedItemId(kpiItems[0].id);
        setCurrentValueVal(String(kpiItems[0].currentValue || 0));
      }
    } else {
      setSelectedItemId('');
      setCurrentValueVal('');
    }
  }, [kpiItems]);

  const handleItemChange = (itemId: number) => {
    setSelectedItemId(itemId);
    const item = kpiItems.find((i: any) => i.id === itemId);
    if (item) {
      setCurrentValueVal(String(item.currentValue || 0));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setQueuedFiles(prev => [...prev, ...filesArray]);
    }
  };

  const removeFile = (index: number) => {
    setQueuedFiles(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleProgressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId) {
      toast.error('Vui lòng chọn tiêu chí KPI cần cập nhật.');
      return;
    }
    if (currentValueVal === '') {
      toast.error('Vui lòng nhập giá trị hiện tại mới.');
      return;
    }

    setIsSubmittingProgress(true);
    try {
      // 1. Upload all queued files in parallel using Promise.all
      if (queuedFiles.length > 0) {
        await Promise.all(
          queuedFiles.map(async (file) => {
            const presignRes = await kpiAttachmentService.requestPresignedUrl(file.name);
            if (!presignRes.success || !presignRes.data) {
              throw new Error(`Lỗi lấy link upload cho tệp ${file.name}: ${presignRes.message}`);
            }
            const { presignedUrl, objectKey } = presignRes.data;

            await kpiAttachmentService.uploadToS3(presignedUrl, file);

            const confirmRes = await kpiAttachmentService.confirmUpload({
              fileName: file.name,
              objectKey,
              fileType: file.type || 'application/octet-stream',
              fileSize: file.size,
              kpiItemId: Number(selectedItemId)
            });
            if (!confirmRes.success) {
              throw new Error(`Lỗi lưu thông tin tệp ${file.name}: ${confirmRes.message}`);
            }
          })
        );
      }

      // 2. Add progress log
      const progressRes = await kpiTrackingService.addProgress({
        kpiItemId: Number(selectedItemId),
        reporterId: employeeId,
        currentValue: Number(currentValueVal),
        notes: notesVal
      });

      if (progressRes.success) {
        toast.success('Cập nhật tiến độ KPI và tải lên minh chứng thành công!');
        setQueuedFiles([]);
        setNotesVal('');
        await onSuccess();
      } else {
        toast.error('Cập nhật tiến độ thất bại: ' + progressRes.message);
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Đã xảy ra lỗi: ' + (err.message || 'Lỗi không xác định'));
    } finally {
      setIsSubmittingProgress(false);
    }
  };

  const selectedItem = kpiItems.find((i: any) => i.id === selectedItemId);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4 dark:bg-zinc-900 dark:border-zinc-800">
      <h3 className="font-bold text-slate-800 dark:text-zinc-200 text-xs uppercase tracking-wider border-b border-slate-100 dark:border-zinc-850 pb-2 flex items-center gap-1.5">
        <Target className="w-4 h-4 text-indigo-650" />
        Cập nhật tiến trình KPI
      </h3>

      <form onSubmit={handleProgressSubmit} className="space-y-4">
        <div>
          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5">Chọn chỉ tiêu cần cập nhật</label>
          <CustomSelect
            value={selectedItemId}
            onChange={val => handleItemChange(Number(val))}
            options={kpiItems.map((item: any) => ({
              value: item.id,
              label: `${item.name} (${item.currentValue || 0}/${item.targetValue} ${item.unit})`
            }))}
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5">Giá trị thực tế mới</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="any"
              value={currentValueVal}
              onChange={e => setCurrentValueVal(e.target.value)}
              className="w-full p-2.5 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-bold text-slate-800 bg-slate-50/50 dark:bg-zinc-800 dark:text-zinc-200"
              placeholder="Nhập giá trị mới..."
              required
            />
            {selectedItem && (
              <span className="text-xs font-semibold text-slate-400">
                {selectedItem.unit}
              </span>
            )}
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5">Giải trình chi tiết</label>
          <textarea
            rows={3}
            value={notesVal}
            onChange={e => setNotesVal(e.target.value)}
            placeholder="Nhập diễn giải hoạt động cập nhật..."
            className="w-full p-2.5 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs text-slate-700 bg-slate-50/50 dark:bg-zinc-800 dark:text-zinc-200"
          />
        </div>

        {/* Attachment queue section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-[10px] font-bold uppercase text-slate-500">Tài liệu minh chứng</label>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-650 hover:text-indigo-850 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Thêm tài liệu
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Queued files list */}
          {queuedFiles.length > 0 ? (
            <div className="border border-slate-200 dark:border-zinc-700 rounded-xl p-2 bg-slate-50/50 dark:bg-zinc-850 space-y-1.5 max-h-48 overflow-y-auto">
              {queuedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between gap-2 p-2 bg-white dark:bg-zinc-800 rounded-lg border border-slate-150 dark:border-zinc-750 text-xs shadow-sm"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Paperclip className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                    <div className="truncate">
                      <p className="font-semibold text-slate-755 dark:text-zinc-300 truncate text-[11px]">{file.name}</p>
                      <p className="text-[9px] text-slate-400 font-medium">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-50 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 border border-dashed border-slate-200 dark:border-zinc-700 rounded-xl text-[10px] text-slate-450 italic">
              Chưa chọn tài liệu minh chứng nào.
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmittingProgress}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-755 text-white font-bold rounded-xl text-xs transition-all active:scale-[0.98] shadow-md shadow-indigo-600/10 flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          {isSubmittingProgress ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Đang lưu & tải lên...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              Cập nhật tiến độ
            </>
          )}
        </button>
      </form>
    </div>
  );
};
