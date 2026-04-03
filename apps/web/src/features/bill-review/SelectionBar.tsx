import { useState } from 'react';

const TIP_OPTIONS = [0, 5, 10, 12] as const;

interface SelectionBarProps {
  count: number;
  tipPercent: number;
  onTipChange: (percent: number) => void;
}

export function SelectionBar({ count, tipPercent, onTipChange }: SelectionBarProps) {
  const [customActive, setCustomActive] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const visible = count > 0;

  function selectPreset(pct: number) {
    setCustomActive(false);
    setCustomValue('');
    onTipChange(tipPercent === pct ? 0 : pct);
  }

  function activateCustom() {
    setCustomActive(true);
    onTipChange(0);
  }

  function handleCustomChange(raw: string) {
    setCustomValue(raw);
    const parsed = parseFloat(raw);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
      onTipChange(parsed);
    } else {
      onTipChange(0);
    }
  }

  const isPresetActive = (pct: number) => !customActive && tipPercent === pct;

  return (
    <div
      className={[
        'fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-3 transition-all duration-300 ease-out pointer-events-none',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0',
      ].join(' ')}
    >
      <div className="pointer-events-auto rounded-3xl border border-accent/30 bg-surface-elevated/90 backdrop-blur-xl shadow-glow px-5 py-4 flex flex-col gap-3">
        <p className="text-white/60 text-sm font-medium">טיפ לצוות</p>

        <div className="flex gap-2">
          {TIP_OPTIONS.map((pct) => (
            <button
              key={pct}
              onClick={() => selectPreset(pct)}
              className={[
                'flex-1 rounded-xl py-1.5 text-sm font-semibold transition-colors',
                isPresetActive(pct)
                  ? 'bg-accent text-black'
                  : 'bg-surface-card border-surface-border border text-white/60 hover:text-white',
              ].join(' ')}
            >
              {pct}%
            </button>
          ))}

          {customActive ? (
            <input
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={customValue}
              onChange={(e) => handleCustomChange(e.target.value)}
              placeholder="0"
              autoFocus
              className="bg-accent/20 border-accent/50 focus:border-accent w-20 rounded-xl border px-2 py-1.5 text-center text-sm font-semibold text-white outline-none placeholder:text-white/30"
            />
          ) : (
            <button
              onClick={activateCustom}
              className="flex-1 bg-surface-card border-surface-border rounded-xl border py-1.5 text-sm font-semibold text-white/60 transition-colors hover:text-white"
            >
              % מותאם
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
