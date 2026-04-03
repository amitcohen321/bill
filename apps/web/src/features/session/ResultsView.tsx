import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CalculationResult, BillItem } from '@bill/shared';

interface ResultsViewProps {
  results: CalculationResult;
  myDinerId: string | null;
  items: BillItem[];
  admin?: boolean;
  onGoBack?: () => void;
  initialTipPct?: number;
}

const TIP_OPTIONS = [0, 5, 10, 12, 15] as const;

export function ResultsView({
  results,
  myDinerId,
  items,
  admin = false,
  onGoBack,
  initialTipPct = 0,
}: ResultsViewProps) {
  const navigate = useNavigate();
  const [tipPct, setTipPct] = useState<number>(initialTipPct);
  const [customTip, setCustomTip] = useState<string>('');
  const [isCustomMode, setIsCustomMode] = useState(
    initialTipPct > 0 && !(TIP_OPTIONS as readonly number[]).includes(initialTipPct),
  );
  const [roundUp, setRoundUp] = useState(false);
  const [showAdminDetails, setShowAdminDetails] = useState<boolean>(false);
  const currencySymbol = results.currency === 'ILS' ? '₪' : results.currency;
  const priceMap = new Map<string, { name: string; price: number }>(
    items.map((item) => [item.id, { name: item.name, price: item.price }]),
  );

  const myResult = results.dinerResults.find((r) => r.dinerId === myDinerId);
  const tipAmount = myResult ? myResult.total * (tipPct / 100) : 0;
  const rawTotal = myResult ? myResult.total + tipAmount : 0;
  const totalWithTip = roundUp ? Math.ceil(rawTotal) : rawTotal;

  function handlePresetTip(pct: number) {
    setTipPct(pct);
    setIsCustomMode(false);
    setCustomTip('');
  }

  function handleCustomTipChange(val: string) {
    setCustomTip(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0 && num <= 100) {
      setTipPct(num);
    }
  }

  function handleCustomModeClick() {
    setIsCustomMode(true);
    setTipPct(0);
    setCustomTip('');
  }

  // Calculate original bill total and check if fully paid
  const originalTotal = items.reduce((sum, item) => sum + item.price, 0);
  const paidTotal = results.dinerResults.reduce((sum, result) => sum + result.total, 0);
  const isFullyPaid = Math.abs(originalTotal - paidTotal) < 0.01; // small tolerance for rounding

  // Calculate per-item split count and who selected it
  const itemSplitMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const diner of results.dinerResults) {
      for (const itemId of diner.selectedItemIds) {
        map.set(itemId, (map.get(itemId) ?? 0) + 1);
      }
    }
    return map;
  }, [results]);

  const unclaimedItems = useMemo(
    () => items.filter((item) => !itemSplitMap.has(item.id)),
    [items, itemSplitMap],
  );

  // Map items to diners who selected them
  const itemToDinersMap = useMemo(() => {
    const map = new Map<string, Array<{ animal: string; name?: string; dinerId: string }>>();
    for (const diner of results.dinerResults) {
      for (const itemId of diner.selectedItemIds) {
        const list = map.get(itemId) ?? [];
        list.push({
          animal: diner.animal,
          ...(diner.name ? { name: diner.name } : {}),
          dinerId: diner.dinerId,
        });
        map.set(itemId, list);
      }
    }
    return map;
  }, [results]);

  return (
    <div className="flex flex-col gap-4">
      <div className="py-2 text-center">
        <div className="mb-2 text-4xl">🎉</div>
        <h2 className="text-2xl font-bold text-white">החישוב הסתיים</h2>
        <p className="mt-1 text-sm text-white/50">הסכומים הסופיים לתשלום</p>
      </div>
      <button
        onClick={onGoBack ?? (() => navigate('/'))}
        className="text-accent hover:text-accent/80 inline-flex w-fit items-center gap-1 text-base font-medium transition-colors"
      >
        {onGoBack ? '→ חזור לעמוד בחירת מנות' : 'חזור לעמוד הבית'}
      </button>

      {/* Warning if not fully paid */}
      {!isFullyPaid && (
        <div className="flex flex-col gap-2 rounded-2xl border border-yellow-800/50 bg-yellow-950 p-4">
          <p className="flex gap-2 text-sm text-yellow-300">
            <span>⚠️</span>
            <span>
              נותר לתשלום: {currencySymbol}
              {(originalTotal - paidTotal).toFixed(2)} 
            </span>
          </p>
          {unclaimedItems.length > 0 && (
            <div className="flex flex-col gap-1 pr-6 text-xs text-yellow-400/80">
              <p className="font-semibold">פריטים שאף אחד לא סימן:</p>
              {unclaimedItems.map((item) => (
                <div key={item.id} className="flex justify-between gap-2">
                  <span>{item.name}</span>
                  <span className="tabular-nums">
                    {currencySymbol}
                    {item.price.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {myResult && (
        <div className="bg-accent/10 border-accent/30 rounded-3xl border p-5 text-center">
          <p className="mb-1 text-lg font-medium text-white/60">
            הסכום שלך {myResult.animal}
            {myResult.name ? ` (${myResult.name})` : ''}
          </p>
          <div className="flex items-center justify-center gap-3">
            <p className="text-accent text-5xl font-bold tabular-nums">
              {currencySymbol}
              {roundUp ? totalWithTip : totalWithTip.toFixed(2)}
            </p>
            <button
              onClick={() => setRoundUp((r) => !r)}
              className={[
                'self-center rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                roundUp
                  ? 'bg-accent border-accent text-black'
                  : 'border-white/20 bg-transparent text-white/60 hover:border-white/40',
              ].join(' ')}
            >
              עגל סכום
            </button>
          </div>

          {/* Tip selector */}
          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">
              טיפ למלצר
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {TIP_OPTIONS.map((pct) => (
                <button
                  key={pct}
                  onClick={() => handlePresetTip(pct)}
                  className={[
                    'rounded-xl px-3 py-1.5 text-sm font-semibold transition-colors',
                    !isCustomMode && tipPct === pct
                      ? 'bg-accent text-black'
                      : 'bg-surface-elevated border-surface-border border text-white/60',
                  ].join(' ')}
                >
                  {pct}%
                </button>
              ))}
              {/* Custom tip button / input */}
              {isCustomMode ? (
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={customTip}
                  onChange={(e) => handleCustomTipChange(e.target.value)}
                  placeholder="0"
                  autoFocus
                  className="bg-accent/20 border-accent/50 focus:border-accent w-20 rounded-xl border px-2 py-1.5 text-center text-sm font-semibold text-white outline-none placeholder:text-white/30"
                />
              ) : (
                <button
                  onClick={handleCustomModeClick}
                  className="bg-surface-elevated border-surface-border rounded-xl border px-3 py-1.5 text-sm font-semibold text-white/60 transition-colors"
                >
                  % מותאם
                </button>
              )}
            </div>
            {tipPct > 0 && (
              <>
                <div className="mt-3 flex justify-between px-1 text-sm text-white/50">
                  <span>בסיס</span>
                  <span className="tabular-nums">
                    {currencySymbol}
                    {myResult.total.toFixed(2)}
                  </span>
                </div>
                <div className="mt-0.5 flex justify-between px-1 text-sm text-white/50">
                  <span>טיפ {tipPct % 1 === 0 ? tipPct : tipPct.toFixed(1)}%</span>
                  <span className="tabular-nums">
                    + {currencySymbol}
                    {tipAmount.toFixed(2)}
                  </span>
                </div>
              </>
            )}
          </div>

          {myResult.selectedItemIds.length > 0 && (
            <div className="border-accent/20 mt-3 border-t pt-3 text-right">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">
                פירוט
              </p>
              {myResult.selectedItemIds.map((itemId) => {
                const item = priceMap.get(itemId);
                if (!item) return null;
                const diners = itemToDinersMap.get(itemId) ?? [];
                const otherDiners = diners.filter((d) => d.dinerId !== myDinerId);
                return (
                  <div key={itemId} className="flex flex-col gap-0.5 py-0.5 text-sm">
                    <div className="flex justify-between text-white/70">
                      <span>{item.name}</span>
                      <span className="tabular-nums text-white/50">
                        {currencySymbol}
                        {item.price.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-right text-xs text-white/40">
                      {otherDiners.length > 0 ? (
                        <>
                          גם{' '}
                          {otherDiners
                            .map((d) => `${d.animal}${d.name ? ` (${d.name})` : ''}`)
                            .join(', ')}
                        </>
                      ) : (
                        <>רק אתה</>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="bg-surface-card border-surface-border rounded-2xl border p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/40">כולם</p>
          {admin && (
            <button
              onClick={() => setShowAdminDetails(!showAdminDetails)}
              className="text-accent hover:text-accent/80 text-xs font-semibold transition-colors"
            >
              {showAdminDetails ? '▼' : '▶'} פרטים
            </button>
          )}
        </div>
        <div className="flex flex-col gap-2">
          {results.dinerResults.map((result) => (
            <div key={result.dinerId}>
              <div
                className={[
                  'flex items-center justify-between rounded-2xl px-3 py-2',
                  result.dinerId === myDinerId ? 'bg-accent/10' : 'bg-surface-elevated',
                ].join(' ')}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{result.animal}</span>
                  {result.name && (
                    <span className="text-sm font-medium text-white">{result.name}</span>
                  )}
                  {result.dinerId === myDinerId && (
                    <span className="text-accent text-xs font-medium">אתה</span>
                  )}
                </div>
                <span className="font-bold tabular-nums text-white">
                  {result.dinerId === myDinerId
                    ? `${currencySymbol}${roundUp ? totalWithTip : totalWithTip.toFixed(2)}`
                    : `${currencySymbol}${result.total.toFixed(2)}`}
                </span>
              </div>

              {/* Admin details - show each diner's items */}
              {admin && showAdminDetails && (
                <div className="border-surface-border ml-3 mt-1 border-l py-1 pl-3 text-right text-xs text-white/50">
                  {result.selectedItemIds.length > 0 ? (
                    result.selectedItemIds.map((itemId) => {
                      const item = priceMap.get(itemId);
                      if (!item) return null;
                      return (
                        <div key={itemId} className="flex justify-between gap-2">
                          <span>{item.name}</span>
                          <span className="tabular-nums">
                            {currencySymbol}
                            {item.price.toFixed(2)}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <p>לא בחר פריטים</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
