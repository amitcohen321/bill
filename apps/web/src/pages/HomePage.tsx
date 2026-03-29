import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE_BYTES } from '@bill/shared';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { getTableByCode, createTable, uploadBillImage } from '../lib/api/tables';
import { ApiError } from '../lib/api/client';
import { setAdminToken } from '../lib/manager';

export function HomePage() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [lastTableId, setLastTableId] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [fileError, setFileError] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef('');

  useEffect(() => {
    setLastTableId(sessionStorage.getItem('bill_last_table'));
  }, []);

  const joinMutation = useMutation({
    mutationFn: getTableByCode,
    onSuccess: (table) => {
      navigate(`/tables/${table.tableId}`);
    },
    onError: (err) => {
      setJoinError(
        err instanceof ApiError ? 'קוד שולחן לא נמצא. נסה שוב.' : 'שגיאה. נסה שוב.',
      );
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const table = await createTable();
      setAdminToken(table.tableId, table.adminToken);
      try {
        await uploadBillImage(table.tableId, file);
      } catch (err) {
        if (err instanceof ApiError && err.code === 'BILL_EXTRACTION_FAILED') {
          await uploadBillImage(table.tableId, file);
        } else {
          throw err;
        }
      }
      return table;
    },
    onSuccess: (table) => {
      const name = nameRef.current.trim();
      if (name) {
        localStorage.setItem(`bill_name_${table.tableId}`, name);
      }
      navigate(`/tables/${table.tableId}`);
    },
  });

  function handleCameraChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileError(null);
    if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
      setFileError('סוג קובץ לא נתמך. יש להעלות תמונה (JPG, PNG, WEBP, HEIC).');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setFileError('הקובץ גדול מדי. גודל מקסימלי: 10MB.');
      return;
    }
    uploadMutation.mutate(file);
  }

  function handleCodeChange(value: string) {
    setJoinError(null);
    const digits = value.replace(/\D/g, '').slice(0, 4);
    setCode(digits);
    if (digits.length === 4) {
      joinMutation.mutate(digits);
    }
  }

  return (
    <div
      className="flex flex-col bg-surface overflow-hidden"
      style={{
        height: '100dvh',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-brand-secondary/8 rounded-full blur-3xl" />
      </div>

      {/* Top-right — back to table */}
      {lastTableId && (
        <div className="absolute top-4 right-4 z-10" style={{ top: 'max(1rem, env(safe-area-inset-top))' }}>
          <button
            onClick={() => navigate(`/tables/${lastTableId}`)}
            className="flex items-center gap-1.5 rounded-2xl border border-surface-border bg-surface-elevated/80 backdrop-blur px-3 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors"
          >
           → חזרה לשולחן
          </button>
        </div>
      )}

      <div className="relative flex-1 flex flex-col items-center px-5 pt-4 pb-3 min-h-0">
        {/* Top — logo / branding */}
        <div className="flex flex-col items-center gap-1 sm:gap-2">
          <img src="/hero.png" alt="Billy" className="w-40 h-40 sm:w-56 sm:h-56 object-contain drop-shadow-2xl" />
          <h1 className="text-xl sm:text-3xl font-bold text-white tracking-tight">בילי</h1>
          <p className="text-white/40 text-xs sm:text-base text-center">
            פיצול חשבון מסעדה בקלות ובמהירות
          </p>
        </div>

        {/* Middle — feature highlights (horizontal) */}
        <div className="w-full max-w-sm flex flex-col gap-1.5 mt-2 sm:mt-4">
          <div className="flex items-center gap-1">
            <FeatureCard icon="📸" text="צילום של החשבון" />
            <StepArrow />
            <FeatureCard icon="🤖" text="חילוץ פריטים אוטומטי" />
            <StepArrow />
            <FeatureCard icon="👥" text="פיצול קל בין כולם" />
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1">
              <span className="text-xs font-semibold text-accent tracking-wide whitespace-nowrap">✨ Powered by AI</span>
            </div>
          </div>
        </div>

        {/* Bottom — CTAs */}
        <div className="w-full max-w-sm flex flex-col gap-2 mt-auto pt-2 sm:pt-4">
          {uploadMutation.isPending && (
            <div className="flex flex-col gap-2">
              <Input
                placeholder="מה שמך? (אופציונלי)"
                value={nameInput}
                onChange={(e) => {
                  nameRef.current = e.target.value;
                  setNameInput(e.target.value);
                }}
                autoFocus
              />
            </div>
          )}
          {fileError && <p className="text-red-400 text-sm text-center">{fileError}</p>}
          {uploadMutation.isError && (
            <p className="text-red-400 text-sm text-center">שגיאה בעיבוד הקבלה. נא לנסות שוב.</p>
          )}
          <Button
            size="lg"
            fullWidth
            loading={uploadMutation.isPending}
            disabled={uploadMutation.isPending}
            onClick={() => cameraInputRef.current?.click()}
          >
          צלם חשבון
          </Button>
          <input
            ref={cameraInputRef}
            type="file"
            accept={ALLOWED_IMAGE_TYPES.join(',')}
            capture="environment"
            onChange={handleCameraChange}
            className="hidden"
            aria-hidden="true"
          />
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-surface-border" />
            <span className="text-white/30 text-xs">או</span>
            <div className="flex-1 h-px bg-surface-border" />
          </div>
          <button
            disabled={uploadMutation.isPending}
            onClick={() => galleryInputRef.current?.click()}
            className="w-full h-12 sm:h-14 flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/20 text-white/50 text-sm sm:text-base font-medium hover:border-accent/50 hover:text-white/80 transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            ⬆️ העלה מהגלריה
          </button>
          <input
            ref={galleryInputRef}
            type="file"
            accept={ALLOWED_IMAGE_TYPES.join(',')}
            onChange={handleCameraChange}
            className="hidden"
            aria-hidden="true"
          />
          {uploadMutation.isPending && (
            <p className="text-center text-white/60 text-sm font-medium">⏳ מעבד את הקבלה...</p>
          )}

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-surface-border" />
            <span className="text-white/30 text-xs">או הצטרף לשולחן קיים</span>
            <div className="flex-1 h-px bg-surface-border" />
          </div>

          {/* Code entry */}
          <div className="flex flex-col gap-2">
            <div className={[
              'flex flex-col rounded-2xl border bg-surface-elevated px-4 pt-2 pb-1 transition-colors',
              joinError ? 'border-red-500/50' : 'border-surface-border focus-within:border-accent/40',
            ].join(' ')}>
              <span className="text-white/30 text-xs text-center">קוד הצטרפות לשולחן</span>
              <div className="flex items-center justify-center gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={code}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  placeholder="0000"
                  className="w-full bg-transparent text-white text-center text-2xl font-bold tabular-nums tracking-[0.3em] py-2 outline-none placeholder-white/15"
                />
                {joinMutation.isPending && (
                  <div className="w-4 h-4 rounded-full border-2 border-accent border-t-transparent animate-spin shrink-0" />
                )}
              </div>
            </div>

            {joinError && (
              <p className="text-red-400 text-sm text-center">{joinError}</p>
            )}
          </div>

          <p className="text-center text-white/30 text-xs pb-1">
            ללא הרשמה · ללא חשבון · מיידי
          </p>
        </div>
      </div>
    </div>
  );
}

function StepArrow() {
  return (
    <div className="shrink-0 flex items-center gap-0.5">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-accent/50">
        <path d="M11 7H3M3 7L6.5 3.5M3 7L6.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="w-2 h-px bg-gradient-to-l from-transparent to-accent/40" />
    </div>
  );
}

function FeatureCard({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex-1 flex flex-col items-center gap-1 px-2 py-2 sm:py-3.5 text-center">
      <span className="text-xl sm:text-2xl">{icon}</span>
      <span className="text-white/50 text-xs font-medium leading-snug">{text}</span>
    </div>
  );
}
