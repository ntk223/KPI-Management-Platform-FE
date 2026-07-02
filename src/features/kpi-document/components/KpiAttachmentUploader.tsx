import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Upload,
  FileText,
  File,
  Image,
  Paperclip,
  Trash2,
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Eye,
} from 'lucide-react';
import { kpiAttachmentService } from '../services/kpiAttachmentService';
import { KpiAttachmentDTO } from '../types';
import { useToast } from '../../../context';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
];
const MAX_FILE_SIZE_MB = 20;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(fileType: string) {
  if (fileType.startsWith('image/')) return <Image className="w-4 h-4 text-indigo-500" />;
  if (fileType === 'application/pdf') return <FileText className="w-4 h-4 text-rose-500" />;
  if (fileType.includes('word')) return <FileText className="w-4 h-4 text-blue-500" />;
  if (fileType.includes('excel') || fileType.includes('spreadsheet'))
    return <FileText className="w-4 h-4 text-emerald-500" />;
  return <File className="w-4 h-4 text-slate-400" />;
}

// ─── Sub-types ────────────────────────────────────────────────────────────────

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

interface PendingFile {
  id: string; // uuid-ish
  file: File;
  status: UploadStatus;
  progress: number; // 0-100 simulated
  error?: string;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface KpiAttachmentUploaderProps {
  kpiItemId: number;
  kpiItemName?: string;
  /** If true, only show the list of existing attachments (manager read-only mode) */
  readOnly?: boolean;
  /** Called after each successful upload so parent can refresh */
  onUploadSuccess?: (attachment: KpiAttachmentDTO) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const KpiAttachmentUploader: React.FC<KpiAttachmentUploaderProps> = ({
  kpiItemId,
  kpiItemName,
  readOnly = false,
  onUploadSuccess,
}) => {
  const toast = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [attachments, setAttachments] = useState<KpiAttachmentDTO[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Fetch existing attachments ──────────────────────────────────────────────
  const fetchAttachments = useCallback(async () => {
    setIsLoadingList(true);
    try {
      const res = await kpiAttachmentService.getByKpiItemId(kpiItemId);
      if (res.success && res.data) {
        setAttachments(res.data);
      }
    } catch (err) {
      console.error('Failed to load attachments', err);
    } finally {
      setIsLoadingList(false);
    }
  }, [kpiItemId]);

  useEffect(() => {
    if (kpiItemId) fetchAttachments();
  }, [kpiItemId, fetchAttachments]);

  // ── File validation ─────────────────────────────────────────────────────────
  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE_BYTES)
      return `Tệp vượt quá giới hạn ${MAX_FILE_SIZE_MB}MB.`;
    if (!ALLOWED_TYPES.includes(file.type))
      return 'Định dạng tệp không được hỗ trợ. Chấp nhận: PDF, ảnh, Word, Excel.';
    return null;
  };

  // ── Core upload flow ────────────────────────────────────────────────────────
  const uploadFile = useCallback(
    async (pendingId: string, file: File) => {
      const updateStatus = (status: UploadStatus, progress = 0, error?: string) => {
        setPendingFiles(prev =>
          prev.map(pf => (pf.id === pendingId ? { ...pf, status, progress, error } : pf))
        );
      };

      try {
        updateStatus('uploading', 10);

        // 1️⃣ Request presigned URL
        const presignRes = await kpiAttachmentService.requestPresignedUrl(file.name);
        if (!presignRes.success || !presignRes.data) {
          throw new Error(presignRes.message || 'Không thể lấy presigned URL');
        }
        const { presignedUrl, objectKey } = presignRes.data;
        updateStatus('uploading', 40);

        // 2️⃣ PUT directly to S3
        await kpiAttachmentService.uploadToS3(presignedUrl, file);
        updateStatus('uploading', 80);

        // 3️⃣ Confirm upload → save to DB
        const confirmRes = await kpiAttachmentService.confirmUpload({
          fileName: file.name,
          objectKey,
          fileType: file.type,
          fileSize: file.size,
          kpiItemId,
        });
        if (!confirmRes.success || !confirmRes.data) {
          throw new Error(confirmRes.message || 'Xác nhận upload thất bại');
        }
        updateStatus('success', 100);

        // Refresh attachment list
        setAttachments(prev => [confirmRes.data!, ...prev]);
        if (onUploadSuccess) onUploadSuccess(confirmRes.data!);

        // Auto-remove from pending after 2s
        setTimeout(() => {
          setPendingFiles(prev => prev.filter(pf => pf.id !== pendingId));
        }, 2000);
      } catch (err: any) {
        const msg = err?.response?.data?.message || err?.message || 'Lỗi không xác định khi upload.';
        updateStatus('error', 0, msg);
      }
    },
    [kpiItemId, onUploadSuccess]
  );

  // ── Handle file selection ───────────────────────────────────────────────────
  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const toAdd: PendingFile[] = [];
    for (const file of Array.from(files)) {
      const err = validateFile(file);
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      toAdd.push({ id, file, status: err ? 'error' : 'idle', progress: 0, error: err || undefined });
    }
    setPendingFiles(prev => [...prev, ...toAdd]);
    // Start uploading valid files immediately
    toAdd.filter(pf => !pf.error).forEach(pf => uploadFile(pf.id, pf.file));
  };

  // ── Drag & drop handlers ────────────────────────────────────────────────────
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  // ── Download ────────────────────────────────────────────────────────────────
  const handleDownload = async (att: KpiAttachmentDTO) => {
    setDownloadingId(att.id);
    try {
      const res = await kpiAttachmentService.getDownloadUrl(att.id);
      if (res.success && res.data) {
        const link = document.createElement('a');
        link.href = res.data;
        link.download = att.fileName;
        link.click();
      } else {
        toast.error('Không thể tạo đường dẫn tải xuống: ' + res.message);
      }
    } catch (err: any) {
      toast.error('Lỗi khi tải xuống tệp: ' + (err?.response?.data?.message || err?.message || 'Lỗi không xác định'));
    } finally {
      setDownloadingId(null);
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async (id: number) => {
    try {
      await kpiAttachmentService.deleteAttachment(id);
      setAttachments(prev => prev.filter(a => a.id !== id));
      toast.success('Xóa minh chứng thành công!');
    } catch (err: any) {
      toast.error('Lỗi khi xóa minh chứng: ' + (err?.response?.data?.message || err?.message || 'Lỗi không xác định'));
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Paperclip className="w-4 h-4 text-indigo-600" />
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
            Minh chứng{kpiItemName ? `: ${kpiItemName}` : ''}
          </span>
        </div>
        <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200">
          {attachments.length} tệp
        </span>
      </div>

      {/* Upload drop zone (hidden in readOnly) */}
      {!readOnly && (
        <>
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer
              transition-all duration-200 group overflow-hidden
              ${isDragging
                ? 'border-indigo-400 bg-indigo-50/60 scale-[1.01]'
                : 'border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/30 bg-slate-50/30'
              }
            `}
          >
            {/* Animated BG glow */}
            <div className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${isDragging ? 'opacity-100' : 'opacity-0'}`}>
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/40 to-violet-100/40 rounded-2xl" />
            </div>

            <div className="relative flex flex-col items-center gap-2.5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isDragging ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600'}`}>
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-600 group-hover:text-indigo-700 transition-colors">
                  {isDragging ? 'Thả tệp vào đây…' : 'Kéo thả hoặc nhấn để chọn tệp minh chứng'}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  PDF, ảnh, Word, Excel · Tối đa {MAX_FILE_SIZE_MB}MB mỗi tệp
                </p>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              accept={ALLOWED_TYPES.join(',')}
              onChange={e => handleFiles(e.target.files)}
            />
          </div>

          {/* Pending file queue */}
          {pendingFiles.length > 0 && (
            <div className="space-y-2">
              {pendingFiles.map(pf => (
                <div
                  key={pf.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-xs transition-all ${
                    pf.status === 'error'
                      ? 'bg-rose-50 border-rose-200'
                      : pf.status === 'success'
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex-shrink-0">{getFileIcon(pf.file.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-700 truncate">{pf.file.name}</p>
                    <p className="text-[10px] text-slate-400">{formatBytes(pf.file.size)}</p>
                    {pf.status === 'uploading' && (
                      <div className="mt-1.5 w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                          style={{ width: `${pf.progress}%` }}
                        />
                      </div>
                    )}
                    {pf.status === 'error' && (
                      <p className="text-[10px] text-rose-600 font-semibold mt-0.5">{pf.error}</p>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    {pf.status === 'uploading' && (
                      <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                    )}
                    {pf.status === 'success' && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    )}
                    {pf.status === 'error' && (
                      <button
                        onClick={() => setPendingFiles(prev => prev.filter(p => p.id !== pf.id))}
                        className="text-slate-400 hover:text-rose-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Existing attachments list */}
      <div className="space-y-2">
        {isLoadingList && (
          <div className="flex items-center justify-center py-4 gap-2 text-slate-400 text-xs">
            <Loader2 className="w-4 h-4 animate-spin" />
            Đang tải danh sách minh chứng...
          </div>
        )}

        {!isLoadingList && attachments.length === 0 && (
          <div className="text-center py-4 text-xs text-slate-400 italic">
            {readOnly ? 'Nhân viên chưa tải lên minh chứng nào.' : 'Chưa có minh chứng nào được tải lên.'}
          </div>
        )}

        {attachments.map(att => (
          <div
            key={att.id}
            className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 hover:border-indigo-200 hover:shadow-sm transition-all group"
          >
            <div className="flex-shrink-0 w-8 h-8 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center">
              {getFileIcon(att.fileType)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-700 truncate">{att.fileName}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-slate-400">{formatBytes(att.fileSize)}</span>
                {att.uploadedAt && (
                  <span className="text-[10px] text-slate-400">
                    · {new Date(att.uploadedAt).toLocaleDateString('vi-VN')}
                  </span>
                )}
                {att.uploadedBy && (
                  <span className="text-[10px] text-slate-400 truncate">
                    · {att.uploadedBy}
                  </span>
                )}
              </div>
            </div>
            {deleteConfirmId === att.id ? (
              <div className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/20 p-1 rounded-lg border border-rose-200 dark:border-rose-900 animate-[fadeIn_0.15s_ease-out] flex-shrink-0">
                <span className="text-[9px] font-bold text-rose-700 dark:text-rose-350">Xóa?</span>
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-1.5 py-0.5 bg-white border border-slate-200 text-slate-600 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 hover:bg-slate-50 text-[9px] font-bold rounded cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  onClick={() => {
                    setDeleteConfirmId(null);
                    handleDelete(att.id);
                  }}
                  className="px-2 py-0.5 bg-rose-600 text-white hover:bg-rose-700 text-[9px] font-bold rounded cursor-pointer"
                >
                  Xóa
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  {/* Download */}
                  <button
                    title="Tải xuống"
                    onClick={() => handleDownload(att)}
                    disabled={downloadingId === att.id}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-50"
                  >
                    {downloadingId === att.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Download className="w-3.5 h-3.5" />
                    }
                  </button>
                  {/* Preview (images only) */}
                  {att.fileType.startsWith('image/') && (
                    <button
                      title="Xem trước"
                      onClick={async () => {
                        const res = await kpiAttachmentService.getDownloadUrl(att.id);
                        if (res.success && res.data) window.open(res.data, '_blank');
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {/* Delete (only for uploader / not readOnly) */}
                  {!readOnly && (
                    <button
                      title="Xóa minh chứng"
                      onClick={() => setDeleteConfirmId(att.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {/* Always-visible download for readOnly */}
                {readOnly && (
                  <button
                    title="Tải xuống"
                    onClick={() => handleDownload(att)}
                    disabled={downloadingId === att.id}
                    className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-[10px] font-bold transition-colors border border-indigo-100 disabled:opacity-50"
                  >
                    {downloadingId === att.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Download className="w-3.5 h-3.5" />
                    }
                    Tải xuống
                  </button>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {/* Error indicator */}
      {pendingFiles.some(pf => pf.status === 'error') && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>Một số tệp không thể upload. Vui lòng kiểm tra lại.</span>
        </div>
      )}
    </div>
  );
};
