import { useState } from 'react';

interface SelectionBarProps {
  count: number;
  selectedSum: number;
  currency: string;
}

const TIP_OPTIONS = [0, 5, 10, 12, 15] as const;

export function SelectionBar({ count, selectedSum, currency }: SelectionBarProps) {
  const visible = count > 0;
  const [tipPct, setTipPct] = useState<number>(0);

  const tipAmount = selectedSum * (tipPct / 100);
  const totalWithTip = selectedSum + tipAmount;

  return (
    <div
      className={[
        'fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-3 transition-all duration-300 ease-out pointer-events-none',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0',
      ].join(' ')}
    >
      <div className="pointer-events-auto rounded-3xl border border-accent/30 bg-surface-elevated/90 backdrop-blur-xl shadow-glow px-5 py-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-white/60 text-sm font-medium">
            {count} {count === 1 ? 'פריט' : 'פריטים'} נבחרו
          </p>
          <div className="flex flex-col items-end">
            {tipPct > 0 && (
              <span className="text-white/40 text-xs tabular-nums">
                כולל טיפ {tipPct}% ({currency}{tipAmount.toFixed(2)})
              </span>
            )}
            <p className="text-white text-lg font-bold tabular-nums">
              {currency}{totalWithTip.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-white/50 text-xs font-medium ml-1">טיפ</span>
          {TIP_OPTIONS.map((pct) => {
            const isActive = tipPct === pct;
            return (
              <button
                key={pct}
                onClick={() => setTipPct(pct)}
                className={[
                  'flex-1 rounded-xl py-1.5 text-sm font-semibold transition-colors border tabular-nums',
                  isActive
                    ? 'bg-accent/20 border-accent/60 text-accent'
                    : 'bg-surface-card border-surface-border text-white/60 hover:text-white/90 hover:border-white/20',
                ].join(' ')}
              >
                {pct === 0 ? 'ללא' : `${pct}%`}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
