import { useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE_BYTES } from '@bill/shared';
import { PageLayout } from '../components/ui/PageLayout';
import { Button } from '../components/ui/Button';
import { ApiError } from '../lib/api/client';
import { createTable, uploadBillImage } from '../lib/api/tables';
import { markAsManager } from '../lib/manager';

export function CreateTablePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (file: File) => {
      const table = await createTable();
      markAsManager(table.tableId);
      const extraction = await uploadBillImage(table.tableId, file);
      return { table, extraction };
    },
    onSuccess: ({ table, extraction }) => {
      navigate(`/tables/${table.tableId}/review`, { state: { extraction } });
    },
  });

  const handleFileSelected = useCallback((file: File) => {
    setFileError(null);
    if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
      setFileError('סוג קובץ לא נתמך. יש להעלות תמונה (JPG, PNG, WEBP, HEIC).');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setFileError('הקובץ גדול מדי. גודל מקסימלי: 10MB.');
      return;
    }
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  }, []);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelected(file);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setFileError('יש לצלם או לבחור תמונה של החשבון.');
      return;
    }
    mutation.mutate(selectedFile);
  };

  const isPending = mutation.isPending;

  return (
    <PageLayout showBack title="שולחן חדש">
      <form onSubmit={onSubmit} className="flex flex-col gap-6 mt-6">
        {/* Bill image */}
        <div className="flex flex-col gap-3">
          <span className="text-white/60 text-sm font-medium">תמונת החשבון</span>

          {preview ? (
            <div className="flex flex-col gap-3">
              <div className="relative rounded-3xl overflow-hidden border border-surface-border bg-surface-card aspect-[3/4] w-full">
                <img
                  src={preview}
                  alt="תצוגה מקדימה של החשבון"
                  className="w-full h-full object-contain"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </div>
              {!isPending && (
                <button
                  type="button"
                  onClick={() => { setPreview(null); setSelectedFile(null); setFileError(null); }}
                  className="text-sm text-accent hover:text-accent/80 transition-colors font-medium text-center"
                >
                  החלף תמונה
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div
                className="relative rounded-3xl border-2 border-dashed border-surface-border bg-surface-card flex flex-col items-center justify-center gap-4 py-12 px-6 cursor-pointer hover:border-accent/40 transition-colors"
                onClick={() => cameraInputRef.current?.click()}
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-card border border-accent/20 flex items-center justify-center">
                  <CameraIcon />
                </div>
                <div className="text-center">
                  <p className="text-white font-medium">צלם את החשבון</p>
                  <p className="text-white/40 text-sm mt-1">הקש כדי לפתוח את המצלמה</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-surface-border" />
                <span className="text-white/30 text-sm">או</span>
                <div className="flex-1 h-px bg-surface-border" />
              </div>

              <Button
                type="button"
                variant="secondary"
                size="md"
                fullWidth
                onClick={() => fileInputRef.current?.click()}
              >
                <GalleryIcon />
                בחר מהגלריה
              </Button>
            </div>
          )}

          {fileError && (
            <p className="text-red-400 text-sm">{fileError}</p>
          )}
        </div>

        {mutation.isError && (
          <div className="rounded-2xl bg-red-950 border border-red-800/50 p-4 text-red-300 text-sm">
            {mutation.error instanceof ApiError
              ? mutation.error.message
              : 'שגיאה ביצירת השולחן. נסה שוב.'}
          </div>
        )}

        <Button type="submit" size="lg" fullWidth loading={isPending} disabled={isPending}>
          {isPending ? 'מעבד...' : 'צור שולחן ועבד חשבון'}
        </Button>

        {/* Hidden file inputs */}
        <input ref={cameraInputRef} type="file" accept={ALLOWED_IMAGE_TYPES.join(',')} capture="environment" onChange={onInputChange} className="hidden" aria-hidden="true" />
        <input ref={fileInputRef} type="file" accept={ALLOWED_IMAGE_TYPES.join(',')} onChange={onInputChange} className="hidden" aria-hidden="true" />
      </form>
    </PageLayout>
  );
}

function CameraIcon() {
  return (
    <svg className="w-7 h-7 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function GalleryIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}
