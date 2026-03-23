import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Button } from '../components/ui/Button';
import { getTableByCode } from '../lib/api/tables';
import { ApiError } from '../lib/api/client';

export function HomePage() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);

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

  function handleCodeChange(value: string) {
    setJoinError(null);
    const digits = value.replace(/\D/g, '').slice(0, 4);
    setCode(digits);
    if (digits.length === 4) {
      joinMutation.mutate(digits);
    }
  }

  return (
    <div className="min-h-screen-safe flex flex-col bg-surface overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-brand-secondary/8 rounded-full blur-3xl" />
      </div>

      <div className="relative flex-1 flex flex-col items-center justify-between px-6 py-12">
        {/* Top — logo / branding */}
        <div className="flex flex-col items-center gap-3" style={{ marginTop: '10px' }}>
          <img src="/hero.png" alt="Bill" className="w-64 h-64 object-contain drop-shadow-2xl" />
          <h1 className="text-3xl font-bold text-white tracking-tight">ביל</h1>
          <p className="text-white/40 text-base text-center">
            פיצול חשבון מסעדה בקלות ובמהירות
          </p>
        </div>

        {/* Middle — feature highlights */}
        <div className="w-full max-w-sm flex flex-col gap-3">
          <FeatureRow icon="📸" text="צילום של החשבון" />
          <FeatureRow icon="🤖" text="חילוץ פריטים אוטומטי" />
          <FeatureRow icon="✂️" text="פיצול קל בין כולם" />
          <div className="flex items-center justify-center gap-2 mt-1">
            <div className="flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1">
              <span className="text-xs font-semibold text-accent tracking-wide">✨ Powered by AI</span>
            </div>
          </div>
        </div>

        {/* Bottom — CTAs */}
        <div className="w-full max-w-sm flex flex-col gap-4">
          <Button size="lg" fullWidth onClick={() => navigate('/create-table')} className="mt-8">
            צור שולחן
          </Button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-surface-border" />
            <span className="text-white/30 text-xs">או הצטרף לשולחן קיים</span>
            <div className="flex-1 h-px bg-surface-border" />
          </div>

          {/* Code entry */}
          <div className="flex flex-col gap-2">
            <div className={[
              'flex items-center rounded-2xl border bg-surface-elevated px-4 gap-3 transition-colors',
              joinError ? 'border-red-500/50' : 'border-surface-border focus-within:border-accent/40',
            ].join(' ')}>
              <span className="text-white/30 text-sm shrink-0">קוד הצטרפות לשולחן</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={code}
                onChange={(e) => handleCodeChange(e.target.value)}
                placeholder="0000"
                className="flex-1 bg-transparent text-white text-center text-2xl font-bold tabular-nums tracking-[0.3em] py-3.5 outline-none placeholder-white/15"
              />
              {joinMutation.isPending && (
                <div className="w-4 h-4 rounded-full border-2 border-accent border-t-transparent animate-spin shrink-0" />
              )}
            </div>

            {joinError && (
              <p className="text-red-400 text-sm text-center">{joinError}</p>
            )}
          </div>

          <p className="text-center text-white/30 text-xs">
            ללא הרשמה · ללא חשבון · מיידי
          </p>
        </div>
      </div>
    </div>
  );
}

function FeatureRow({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-surface-card border border-surface-border px-4 py-3.5">
      <span className="text-2xl">{icon}</span>
      <span className="text-white/80 font-medium">{text}</span>
    </div>
  );
}
