import { useState } from 'react';
import type { BillItem, ItemCategory } from '@bill/shared';
import { ITEM_CATEGORIES } from '@bill/shared';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

const CATEGORY_LABELS: Record<ItemCategory, string> = {
  starter: 'מנות פתיחה',
  main: 'עיקריות',
  dessert: 'קינוחים',
  drink: 'שתייה',
  other: 'אחר',
};

const CATEGORY_EMOJI: Record<ItemCategory, string> = {
  starter: '🥗',
  main: '🍽️',
  dessert: '🍰',
  drink: '🥤',
  other: '📦',
};

const DUPE_COLORS = [
  '#60a5fa',
  '#34d399',
  '#fb923c',
  '#f472b6',
  '#facc15',
  '#2dd4bf',
  '#f87171',
  '#c084fc',
];

function buildDupeColorMap(items: BillItem[]): Map<string, string> {
  const nameToIds = new Map<string, string[]>();
  for (const item of items) {
    const group = nameToIds.get(item.name) ?? [];
    group.push(item.id);
    nameToIds.set(item.name, group);
  }
  const map = new Map<string, string>();
  for (const ids of nameToIds.values()) {
    if (ids.length >= 2) {
      ids.forEach((id, i) => {
        map.set(id, DUPE_COLORS[i % DUPE_COLORS.length] ?? DUPE_COLORS[0]!);
      });
    }
  }
  return map;
}

interface ItemListProps {
  items: BillItem[];
  currency: string;
  warnings: string[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  itemParticipants?: Map<string, string[]>; // itemId → animal emojis
  isDone?: boolean | undefined;
  onSetDone?: (() => void) | undefined;
  admin?: boolean | undefined;
  itemReductions?: Record<string, number> | undefined;
  onReduceItem?: ((itemId: string, amount: number) => void) | undefined;
}

interface ItemRowProps {
  item: BillItem;
  selected: boolean;
  dupeColor: string | undefined;
  currencySymbol: string;
  participants: string[];
  onToggle: () => void;
  reduction: number;
  admin: boolean;
  onReduce: ((amount: number) => void) | undefined;
}

function ItemRow({ item, selected, dupeColor: _dupeColor, currencySymbol, participants, onToggle, reduction, admin, onReduce }: ItemRowProps) {
  const otherParticipants = participants;
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const ignored = reduction >= item.price;
  const effectivePrice = Math.max(0, item.price - reduction);

  const handleSaveReduction = () => {
    const val = parseFloat(inputValue);
    if (!isNaN(val) && val >= 0 && val <= item.price) {
      onReduce?.(val);
    }
    setEditing(false);
    setInputValue('');
  };

  return (
    <div
      className={[
        'rounded-3xl border overflow-hidden transition-all duration-150',
        ignored
          ? 'opacity-50 bg-surface-card border-surface-border'
          : selected
            ? 'shadow-glow-sm bg-accent/15 border-accent/30'
            : 'shadow-card bg-surface-card border-surface-border',
      ].join(' ')}
    >
      <button
        onClick={ignored ? undefined : onToggle}
        disabled={ignored}
        className={[
          'w-full flex items-center justify-between px-4 py-3.5 gap-3 text-right',
          ignored ? 'cursor-default' : 'active:scale-[0.98]',
        ].join(' ')}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {!ignored && (
            <div className={[
              'w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors duration-150',
              selected ? 'border-accent bg-accent' : 'border-white/20',
            ].join(' ')}>
              {selected && (
                <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          )}
          <div className="flex flex-col items-start min-w-0">
            <span className={[
              'text-lg font-medium leading-snug truncate w-full',
              ignored ? 'line-through text-white/40' : selected ? 'text-white' : 'text-white/80',
            ].join(' ')}>
              {item.name}
            </span>
            {!ignored && otherParticipants.length > 0 && (
              <span className="text-sm leading-none text-white/50 mt-0.5">
                {otherParticipants.join(', ')}
              </span>
            )}
            {!ignored && otherParticipants.length === 0 && (
              <span className="text-white/25 text-sm mt-0.5">אף אחד</span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end shrink-0">
          {ignored ? (
            <span className="font-semibold text-xl tabular-nums line-through text-white/30">
              {currencySymbol}{item.price.toFixed(2)}
            </span>
          ) : reduction > 0 ? (
            <>
              <span className="text-white/40 text-sm line-through tabular-nums">
                {currencySymbol}{item.price.toFixed(2)}
              </span>
              <span className={['font-semibold text-xl tabular-nums', selected ? 'text-accent' : 'text-accent/70'].join(' ')}>
                {currencySymbol}{effectivePrice.toFixed(2)}
              </span>
            </>
          ) : (
            <span className={['font-semibold text-xl tabular-nums', selected ? 'text-accent' : 'text-accent/70'].join(' ')}>
              {currencySymbol}{item.price.toFixed(2)}
            </span>
          )}
        </div>
      </button>

      {admin && onReduce && !editing && (
        <div className="px-4 pb-3 flex items-center gap-2 flex-wrap">
          {ignored ? (
            <button
              onClick={(e) => { e.stopPropagation(); onReduce(0); }}
              className="text-xs text-accent hover:text-accent/80 font-medium transition-colors"
            >
              שחזר פריט
            </button>
          ) : (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setEditing(true); setInputValue(reduction > 0 ? String(reduction) : ''); }}
                className="text-xs text-white/40 hover:text-white/70 transition-colors"
              >
                {reduction > 0 ? `הופחת ${currencySymbol}${reduction.toFixed(2)} — ערוך` : 'הפחת סכום'}
              </button>
              <span className="text-white/20">|</span>
              <button
                onClick={(e) => { e.stopPropagation(); onReduce(item.price); }}
                className="text-xs text-red-400/60 hover:text-red-400 transition-colors"
              >
                התעלם מפריט
              </button>
              {reduction > 0 && (
                <>
                  <span className="text-white/20">|</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); onReduce(0); }}
                    className="text-xs text-accent/60 hover:text-accent transition-colors"
                  >
                    שחזר
                  </button>
                </>
              )}
            </>
          )}
        </div>
      )}

      {admin && editing && (
        <div className="px-4 pb-3 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <input
            type="number"
            min={0}
            max={item.price}
            step="0.01"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSaveReduction(); }}
            placeholder={`עד ${item.price.toFixed(2)}`}
            autoFocus
            className="w-24 rounded-lg bg-white/10 border border-white/20 px-2 py-1 text-sm text-white placeholder:text-white/30 outline-none focus:border-accent/50"
          />
          <button
            onClick={handleSaveReduction}
            className="text-xs text-accent hover:text-accent/80 font-medium transition-colors"
          >
            שמור
          </button>
          <button
            onClick={() => { setEditing(false); setInputValue(''); }}
            className="text-xs text-white/40 hover:text-white/70 transition-colors"
          >
            ביטול
          </button>
        </div>
      )}
    </div>
  );
}

export function ItemList({
  items,
  currency,
  warnings,
  selectedIds,
  onToggle,
  itemParticipants,
  isDone,
  onSetDone,
  admin,
  itemReductions,
  onReduceItem,
}: ItemListProps) {
  const originalTotal = items.reduce((sum, item) => sum + item.price, 0);
  const total = items.reduce((sum, item) => {
    const reduction = itemReductions?.[item.id] ?? 0;
    return sum + Math.max(0, item.price - reduction);
  }, 0);
  const hasReductions = total !== originalTotal;
  const currencySymbol = currency === 'ILS' ? '₪' : currency;
  const dupeColors = buildDupeColorMap(items);

  if (items.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="text-4xl mb-3">🧾</div>
        <p className="text-white font-medium">לא זוהו פריטים</p>
        <p className="text-white/40 text-sm mt-1">לא הצלחנו לחלץ פריטים מהחשבון. נסה לצלם שוב.</p>
      </Card>
    );
  }

  const grouped = ITEM_CATEGORIES.map((cat) => ({
    category: cat,
    items: items.filter((item) => (item.category ?? 'other') === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="flex flex-col gap-4">
      {warnings.length > 0 && (
        <div className="rounded-2xl bg-yellow-950 border border-yellow-800/50 p-4 space-y-1">
          {warnings.map((w, i) => (
            <p key={i} className="text-yellow-300 text-sm flex gap-2">
              <span>⚠️</span> {w}
            </p>
          ))}
        </div>
      )}

      {grouped.map((group) => (
        <div key={group.category} className="flex flex-col gap-2">
          <div className="flex items-center gap-2 px-1">
            <span className="text-lg">{CATEGORY_EMOJI[group.category]}</span>
            <span className="text-white/60 text-base font-semibold uppercase tracking-wider">
              {CATEGORY_LABELS[group.category]}
            </span>
          </div>
          {group.items.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              selected={selectedIds.has(item.id)}
              dupeColor={dupeColors.get(item.id)}
              currencySymbol={currencySymbol}
              participants={itemParticipants?.get(item.id) ?? []}
              onToggle={() => onToggle(item.id)}
              reduction={itemReductions?.[item.id] ?? 0}
              admin={!!admin}
              onReduce={onReduceItem ? (amount) => onReduceItem(item.id, amount) : undefined}
            />
          ))}
        </div>
      ))}

      <div className="h-px bg-surface-border" />

      <Card glow className="flex items-center justify-between px-4 py-4">
        <span className="text-white/70 font-medium">סה״כ</span>
        <div className="flex flex-col items-end">
          {hasReductions && (
            <span className="text-white/40 text-sm line-through tabular-nums">
              {currencySymbol}{originalTotal.toFixed(2)}
            </span>
          )}
          <span className="text-white font-bold text-xl tabular-nums">
            {currencySymbol}{total.toFixed(2)}
          </span>
        </div>
      </Card>

      {onSetDone && (
        <Button
          size="sm"
          fullWidth
          variant={isDone ? 'secondary' : 'primary'}
          onClick={onSetDone}
        >
          {isDone ? '↩ בטל סיום' : '✓ סיימתי לבחור'}
        </Button>
      )}
    </div>
  );
}
