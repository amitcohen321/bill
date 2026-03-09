import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen-safe flex flex-col bg-surface overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-brand-secondary/8 rounded-full blur-3xl" />
      </div>

      <div className="relative flex-1 flex flex-col items-center justify-between px-6 py-12">
        {/* Top — logo / branding */}
        <div className="flex flex-col items-center gap-3 mt-8">
          <div className="w-20 h-20 rounded-3xl bg-gradient-brand flex items-center justify-center shadow-glow">
            <BillIcon />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Bill Split</h1>
          <p className="text-white/40 text-base text-center">
            פיצול חשבון מסעדה בקלות ובמהירות
          </p>
        </div>

        {/* Middle — feature highlights */}
        <div className="w-full max-w-sm flex flex-col gap-3">
          <FeatureRow icon="📸" text="צלם את החשבון" />
          <FeatureRow icon="🤖" text="חילוץ פריטים אוטומטי" />
          <FeatureRow icon="✂️" text="פיצול קל בין כולם" />
        </div>

        {/* Bottom — CTA */}
        <div className="w-full max-w-sm">
          <Button
            size="lg"
            fullWidth
            onClick={() => navigate('/create-table')}
          >
            צור שולחן
          </Button>
          <p className="text-center text-white/30 text-xs mt-4">
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

function BillIcon() {
  return (
    <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
      />
    </svg>
  );
}
