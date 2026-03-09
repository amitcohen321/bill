import { useState } from 'react';
import { Card } from '../../components/ui/Card';

const PRESET_TIPS = [10, 12] as const;

interface TipSelectorProps {
  tipPercent: number;
  onTipChange: (percent: number) => void;
}

export function TipSelector({ tipPercent, onTipChange }: TipSelectorProps) {
  const [customActive, setCustomActive] = useState(false);
  const [customValue, setCustomValue] = useState('');

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
    <Card className="p-4 flex flex-col gap-3">
      <p className="text-white/60 text-sm font-medium">טיפ לצוות</p>

      <div className="flex gap-2">
        {PRESET_TIPS.map((pct) => (
          <button
            key={pct}
            onClick={() => selectPreset(pct)}
            className={[
              'flex-1 rounded-2xl py-2.5 text-sm font-semibold transition-all duration-150 border',
              isPresetActive(pct)
                ? 'bg-accent/20 border-accent/50 text-accent'
                : 'bg-surface-elevated border-surface-border text-white/60 hover:text-white hover:border-white/20',
            ].join(' ')}
          >
            {pct}%
          </button>
        ))}

        <button
          onClick={activateCustom}
          className={[
            'flex-1 rounded-2xl py-2.5 text-sm font-semibold transition-all duration-150 border',
            customActive
              ? 'bg-accent/20 border-accent/50 text-accent'
              : 'bg-surface-elevated border-surface-border text-white/60 hover:text-white hover:border-white/20',
          ].join(' ')}
        >
          מותאם
        </button>
      </div>

      {customActive && (
        <div className="flex items-center gap-2 rounded-2xl bg-surface-elevated border border-surface-border px-4 py-2.5">
          <input
            type="number"
            min="0"
            max="100"
            step="0.5"
            value={customValue}
            onChange={(e) => handleCustomChange(e.target.value)}
            placeholder="הכנס אחוז"
            autoFocus
            className="flex-1 bg-transparent text-white placeholder-white/30 text-sm outline-none tabular-nums text-right"
          />
          <span className="text-white/50 text-sm shrink-0">%</span>
        </div>
      )}
    </Card>
  );
}
