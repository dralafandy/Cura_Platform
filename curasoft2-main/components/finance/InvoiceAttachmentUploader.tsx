import React, { useState, useRef } from 'react';
import { supabase } from '../../supabaseClient';

type Props = {
  initialUrl?: string;
  folder?: string; // storage folder inside bucket
  bucket?: string;
  onUploadComplete?: (url: string, meta?: { path: string; name: string; size: number; type: string }) => void;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];

const InvoiceAttachmentUploader: React.FC<Props> = ({ initialUrl, folder = 'invoices', bucket = 'attachments', onUploadComplete }) => {
  const [preview, setPreview] = useState<string | undefined>(initialUrl);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const validateFile = (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) return 'نوع الملف غير مدعوم. ارفع صورة أو PDF.';
    if (file.size > MAX_FILE_SIZE) return 'حجم الملف كبير جدًا (أقصى 10 ميغابايت).';
    return null;
  };

  const handlePick = () => inputRef.current?.click();

  const createImagePreview = async (file: File) => {
    if (file.type === 'application/pdf') return URL.createObjectURL(file);

    const img = document.createElement('img');
    const dataUrl = await new Promise<string>((res, rej) => {
      const reader = new FileReader();
      reader.onerror = rej;
      reader.onload = () => res(reader.result as string);
      reader.readAsDataURL(file);
    });
    img.src = dataUrl;
    await img.decode().catch(() => null);

    const maxW = 1600;
    const canvas = document.createElement('canvas');
    const scale = Math.min(1, maxW / (img.width || maxW));
    canvas.width = (img.width || maxW) * scale;
    canvas.height = (img.height || maxW) * scale;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.85);
  };

  const uploadFile = async (file: File) => {
    setError(null);
    setUploading(true);
    setProgress(5);

    try {
      let fileToUpload: File | Blob = file;

      if (file.type.startsWith('image/')) {
        const compressedDataUrl = await createImagePreview(file);
        const res = await fetch(compressedDataUrl);
        const blob = await res.blob();
        fileToUpload = new File([blob], file.name.replace(/\s+/g, '_'), { type: 'image/jpeg' });
      }

      const timestamp = Date.now();
      const safeName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9_.-]/g, '_')}`;
      const path = `${folder}/${safeName}`;

      const sb = supabase;
      if (!sb) throw new Error('Supabase client not initialized');

      const { error: uploadErr } = await sb.storage.from(bucket).upload(path, fileToUpload as File, { cacheControl: '3600', upsert: false });
      if (uploadErr) throw uploadErr;

      setProgress(90);
      const { data: publicData } = sb.storage.from(bucket).getPublicUrl(path);
      const publicURL = publicData?.publicUrl || '';

      setProgress(100);
      setPreview(publicURL);
      onUploadComplete?.(publicURL, { path, name: safeName, size: fileToUpload.size || file.size, type: fileToUpload.type || file.type });
    } catch (err: any) {
      console.error('Upload error', err);
      const msg = err?.message || String(err || 'فشل رفع الملف');
      // Friendly handling for common Supabase storage error when bucket doesn't exist
      if (typeof msg === 'string' && msg.toLowerCase().includes('bucket') && msg.toLowerCase().includes('not found')) {
        setError(`Bucket "${bucket}" غير موجود في Supabase. أنشئ الـ bucket بنفس الاسم أو مرّر prop \'bucket\' إلى المكوّن مع اسم موجود.`);
      } else {
        setError(msg);
      }
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 800);
    }
  };

  const handleFile = (f?: File) => {
    if (!f) return;
    const v = validateFile(f);
    if (v) {
      setError(v);
      return;
    }
    if (f.type === 'application/pdf') setPreview(URL.createObjectURL(f));
    else createImagePreview(f).then(p => setPreview(p)).catch(() => setPreview(URL.createObjectURL(f)));
    uploadFile(f);
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
    e.currentTarget.value = '';
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  return (
    <div>
      <div
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border border-dashed rounded-lg p-3 bg-white flex items-center gap-3"
        style={{ minHeight: 84 }}
      >
        <div className="flex-1">
          <p className="text-sm text-slate-600">اسحب وأفلت الملف هنا أو اضغط للاختيار (صورة أو PDF، حتى 10MB)</p>
          <div className="mt-2 flex items-center gap-2">
            <button type="button" onClick={handlePick} className="px-3 py-1 bg-primary text-white rounded-lg">اختر ملف</button>
            {uploading && <div className="text-sm text-slate-500">جارٍ الرفع... {progress}%</div>}
            {error && <div className="text-sm text-red-600">{error}</div>}
          </div>
        </div>
        <div className="w-24 h-24 flex items-center justify-center">
          {preview ? (
            preview.endsWith('.pdf') || preview.includes('application/pdf') ? (
              <div className="text-sm text-slate-600">PDF</div>
            ) : (
              <img src={preview} alt="preview" className="max-h-20 max-w-20 rounded" />
            )
          ) : (
            <div className="text-slate-400">لا يوجد معاينة</div>
          )}
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/*,.pdf" onChange={onInputChange} className="hidden" />
    </div>
  );
};

export default InvoiceAttachmentUploader;
