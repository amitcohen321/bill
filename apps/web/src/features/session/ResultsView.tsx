import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CalculationResult, BillItem } from '@bill/shared';

interface ResultsViewProps {
  results: CalculationResult;
  myDinerId: string | null;
  items: BillItem[];
  admin?: boolean;
  onGoBack?: () => void;
}

const TIP_OPTIONS = [0, 5, 10, 12] as const;

export function ResultsView({ results, myDinerId, items, admin = false, onGoBack }: ResultsViewProps) {
  const navigate = useNavigate();
  const [tipPct, setTipPct] = useState<number>(0);
  const [customTip, setCustomTip] = useState<string>('');
  const [isCustomMode, setIsCustomMode] = useState(false);
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
    if (pct === 0) setRoundUp(false);
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
    setRoundUp(false);
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
        list.push({ animal: diner.animal, ...(diner.name ? { name: diner.name } : {}), dinerId: diner.dinerId });
        map.set(itemId, list);
      }
    }
    return map;
  }, [results]);

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center py-2">
        <div className="text-4xl mb-2">🎉</div>
        <h2 className="text-2xl font-bold text-white">החישוב הסתיים</h2>
        <p className="text-white/50 text-sm mt-1">הסכומים הסופיים לתשלום</p>
      </div>
      <button
        onClick={onGoBack ?? (() => navigate('/'))}
        className="text-accent hover:text-accent/80 transition-colors text-base font-medium inline-flex items-center gap-1 w-fit"
      >
        {onGoBack ? '→ חזור לעמוד בחירת מנות' : 'חזור לעמוד הבית'} 
      </button>

      {/* Warning if not fully paid */}
      {!isFullyPaid && (
        <div className="rounded-2xl bg-yellow-950 border border-yellow-800/50 p-4 flex flex-col gap-2">
          <p className="text-yellow-300 text-sm flex gap-2">
            <span>⚠️</span>
            <span>
              נותר לתשלום: {currencySymbol}{(originalTotal - paidTotal).toFixed(2)} - לא כל הסכום חולק
            </span>
          </p>
          {unclaimedItems.length > 0 && (
            <div className="text-yellow-400/80 text-xs flex flex-col gap-1 pr-6">
              <p className="font-semibold">פריטים שאף אחד לא סימן:</p>
              {unclaimedItems.map((item) => (
                <div key={item.id} className="flex justify-between gap-2">
                  <span>{item.name}</span>
                  <span className="tabular-nums">{currencySymbol}{item.price.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {myResult && (
        <div className="rounded-3xl bg-accent/10 border border-accent/30 p-5 text-center">
          <p className="text-white/60 text-lg font-medium mb-1">הסכום שלך {myResult.animal}{myResult.name ? ` (${myResult.name})` : ''}</p>
          <div className="flex items-center justify-center gap-3">
            <p className="text-5xl font-bold text-accent tabular-nums">
              {currencySymbol}{roundUp ? totalWithTip : totalWithTip.toFixed(2)}
            </p>
            {tipPct > 0 && (
              <button
                onClick={() => setRoundUp((r) => !r)}
                className={[
                  'px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors self-center',
                  roundUp
                    ? 'bg-accent text-black border-accent'
                    : 'bg-transparent text-white/60 border-white/20 hover:border-white/40',
                ].join(' ')}
              >
                עיגול סכום
              </button>
            )}
          </div>

          {/* Tip selector */}
          <div className="mt-4">
            <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-2">טיפ למלצר</p>
            <div className="flex justify-center gap-2 flex-wrap">
              {TIP_OPTIONS.map((pct) => (
                <button
                  key={pct}
                  onClick={() => handlePresetTip(pct)}
                  className={[
                    'px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors',
                    !isCustomMode && tipPct === pct
                      ? 'bg-accent text-black'
                      : 'bg-surface-elevated text-white/60 border border-surface-border',
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
                  className="w-20 rounded-xl bg-accent/20 border border-accent/50 px-2 py-1.5 text-sm font-semibold text-center text-white outline-none focus:border-accent placeholder:text-white/30"
                />
              ) : (
                <button
                  onClick={handleCustomModeClick}
                  className="px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors bg-surface-elevated text-white/60 border border-surface-border"
                >
                  מותאם
                </button>
              )}
            </div>
            {tipPct > 0 && (
              <>
                <div className="mt-3 flex justify-between text-sm text-white/50 px-1">
                  <span>בסיס</span>
                  <span className="tabular-nums">{currencySymbol}{myResult.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-white/50 px-1 mt-0.5">
                  <span>טיפ {tipPct % 1 === 0 ? tipPct : tipPct.toFixed(1)}%</span>
                  <span className="tabular-nums">+ {currencySymbol}{tipAmount.toFixed(2)}</span>
                </div>
              </>
            )}
          </div>

          {myResult.selectedItemIds.length > 0 && (
            <div className="mt-3 pt-3 border-t border-accent/20 text-right">
              <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-2">פירוט</p>
              {myResult.selectedItemIds.map((itemId) => {
                const item = priceMap.get(itemId);
                if (!item) return null;
                const diners = itemToDinersMap.get(itemId) ?? [];
                const otherDiners = diners.filter((d) => d.dinerId !== myDinerId);
                return (
                  <div key={itemId} className="flex flex-col gap-0.5 text-sm py-0.5">
                    <div className="flex justify-between text-white/70">
                      <span>{item.name}</span>
                      <span className="tabular-nums text-white/50">{currencySymbol}{item.price.toFixed(2)}</span>
                    </div>
                    <div className="text-xs text-white/40 text-right">
                      {otherDiners.length > 0 ? (
                        <>גם {otherDiners.map((d) => `${d.animal}${d.name ? ` (${d.name})` : ''}`).join(', ')}</>
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

      <div className="rounded-2xl bg-surface-card border border-surface-border p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-white/40 text-xs font-semibold uppercase tracking-wider">כולם</p>
            {admin && (
              <button
                onClick={() => setShowAdminDetails(!showAdminDetails)}
                className="text-accent text-xs font-semibold hover:text-accent/80 transition-colors"
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
                    'flex items-center justify-between py-2 px-3 rounded-2xl',
                    result.dinerId === myDinerId ? 'bg-accent/10' : 'bg-surface-elevated',
                  ].join(' ')}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{result.animal}</span>
                    {result.name && <span className="text-white text-sm font-medium">{result.name}</span>}
                    {result.dinerId === myDinerId && (
                      <span className="text-accent text-xs font-medium">אתה</span>
                    )}
                  </div>
                  <span className="font-bold text-white tabular-nums">
                    {result.dinerId === myDinerId
                      ? `${currencySymbol}${roundUp ? totalWithTip : totalWithTip.toFixed(2)}`
                      : `${currencySymbol}${result.total.toFixed(2)}`}
                  </span>
                </div>

                {/* Admin details - show each diner's items */}
                {admin && showAdminDetails && (
                  <div className="mt-1 ml-3 pl-3 border-l border-surface-border text-right text-xs text-white/50 py-1">
                    {result.selectedItemIds.length > 0 ? (
                      result.selectedItemIds.map((itemId) => {
                        const item = priceMap.get(itemId);
                        if (!item) return null;
                        return (
                          <div key={itemId} className="flex justify-between gap-2">
                            <span>{item.name}</span>
                            <span className="tabular-nums">{currencySymbol}{item.price.toFixed(2)}</span>
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
