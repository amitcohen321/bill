import { useRef, useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE_BYTES } from '@bill/shared';
import { uploadBillImage } from '../../lib/api/tables';
import { Button } from '../../components/ui/Button';
import { ApiError } from '../../lib/api/client';

interface BillCaptureProps {
  tableId: string;
}

export function BillCapture({ tableId }: BillCaptureProps) {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: ({ file }: { file: File }) => uploadBillImage(tableId, file),
    onSuccess: () => {
      navigate(`/tables/${tableId}`);
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
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
  }, []);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelected(file);
  };

  const handleRescan = () => {
    setPreview(null);
    setSelectedFile(null);
    setFileError(null);
    mutation.reset();
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleSubmit = () => {
    if (selectedFile) {
      mutation.mutate({ file: selectedFile });
    }
  };

  if (preview && selectedFile) {
    return (
      <div className="flex flex-col gap-4">
        <div className="border-surface-border bg-surface-card relative aspect-[3/4] w-full overflow-hidden rounded-3xl border">
          <img
            src={preview}
            alt="תצוגה מקדימה של החשבון"
            className="h-full w-full object-contain"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>

        {mutation.isError && (
          <div className="rounded-2xl border border-red-800/50 bg-red-950 p-4 text-sm text-red-300">
            {mutation.error instanceof ApiError && mutation.error.code === 'BILL_EXTRACTION_FAILED'
              ? mutation.error.message
              : 'שגיאה בעיבוד החשבון. נסה לצלם שוב.'}
          </div>
        )}

        <div className="flex flex-col gap-3">
          <Button size="lg" fullWidth onClick={handleSubmit} loading={mutation.isPending}>
            {mutation.isPending ? 'מעבד את החשבון...' : 'עבד חשבון'}
          </Button>
          <Button
            size="md"
            variant="secondary"
            fullWidth
            onClick={handleRescan}
            disabled={mutation.isPending}
          >
            צלם שוב
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div
        className="border-surface-border bg-surface-card hover:border-accent/40 relative flex cursor-pointer flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed px-6 py-16 transition-colors"
        onClick={() => cameraInputRef.current?.click()}
      >
        <div className="bg-gradient-card border-accent/20 flex h-16 w-16 items-center justify-center rounded-2xl border">
          <CameraIcon />
        </div>
        <div className="text-center">
          <p className="font-medium text-white">צלם את החשבון</p>
          <p className="mt-1 text-sm text-white/40">הקש כדי לפתוח את המצלמה</p>
        </div>
      </div>

      {fileError && (
        <div className="rounded-2xl border border-red-800/50 bg-red-950 p-4 text-sm text-red-300">
          {fileError}
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="bg-surface-border h-px flex-1" />
        <span className="text-sm text-white/30">או</span>
        <div className="bg-surface-border h-px flex-1" />
      </div>

      <Button variant="secondary" size="md" fullWidth onClick={() => fileInputRef.current?.click()}>
        <GalleryIcon />
        בחר מהגלריה
      </Button>

      {/* Camera input — triggers native camera */}
      <input
        ref={cameraInputRef}
        type="file"
        accept={ALLOWED_IMAGE_TYPES.join(',')}
        capture="environment"
        onChange={onInputChange}
        className="hidden"
        aria-hidden="true"
      />

      {/* Gallery / file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_IMAGE_TYPES.join(',')}
        onChange={onInputChange}
        className="hidden"
        aria-hidden="true"
      />
    </div>
  );
}

function CameraIcon() {
  return (
    <svg className="text-accent h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

function GalleryIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}
