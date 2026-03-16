import { useState } from 'react';

interface SelectionBarProps {
  count: number;
  subtotal: number;
  tipPercent: number;
  currency: string;
  onApprove?: () => void;
}

export function SelectionBar({ count, subtotal, tipPercent, currency }: SelectionBarProps) {
  const [rounded, setRounded] = useState(false);
  const currencySymbol = currency === 'ILS' ? '₪' : currency;
  const visible = count > 0;
  const grandTotal = subtotal * (1 + tipPercent / 100);
  const displayTotal = rounded ? Math.round(grandTotal) : grandTotal;
  const hasTip = tipPercent > 0;

  return (
    <div
      className={[
        'fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-3 transition-all duration-300 ease-out pointer-events-none',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0',
      ].join(' ')}
    >
      <div className="pointer-events-auto rounded-3xl border border-accent/30 bg-surface-elevated/90 backdrop-blur-xl shadow-glow px-5 py-4 flex items-center justify-between gap-4">
        <div className="flex flex-col min-w-0 gap-0.5">
          <span className="text-white/50 text-xs font-medium">
            {count} {count === 1 ? 'פריט' : 'פריטים'} נבחרו
          </span>

          {hasTip && (
            <div className="flex items-baseline gap-1.5">
              <span className="text-white/40 text-xs tabular-nums line-through">
                {currencySymbol}{subtotal.toFixed(2)}
              </span>
              <span className="text-accent/70 text-xs font-medium">
                +{tipPercent % 1 === 0 ? tipPercent : tipPercent.toFixed(1)}% טיפ
              </span>
            </div>
          )}

          <span className="text-white font-bold text-2xl tabular-nums leading-tight">
            {currencySymbol}{rounded ? displayTotal : grandTotal.toFixed(2)}
          </span>
        </div>

        <button
          onClick={() => setRounded((r) => !r)}
          className={[
            'flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors duration-150',
            rounded
              ? 'bg-accent text-black border-accent'
              : 'bg-transparent text-white/60 border-white/20 hover:border-white/40',
          ].join(' ')}
        >
          עיגול סכום
        </button>
      </div>
    </div>
  );
}
