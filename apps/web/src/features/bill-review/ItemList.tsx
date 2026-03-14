import { useState } from 'react';
import type { BillItem, ItemCategory } from '@bill/shared';
import { ITEM_CATEGORIES } from '@bill/shared';
import { Card } from '../../components/ui/Card';

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
  '#60a5fa', // blue
  '#34d399', // emerald
  '#fb923c', // orange
  '#f472b6', // pink
  '#facc15', // yellow
  '#2dd4bf', // teal
  '#f87171', // red
  '#c084fc', // violet
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
  portions?: Map<string, number>;
  onPortionChange?: (id: string, portion: number) => void;
}

type PortionKey = 'full' | 'half' | 'third' | 'custom';

interface ItemRowProps {
  item: BillItem;
  selected: boolean;
  dupeColor: string | undefined;
  currencySymbol: string;
  portion: number;
  onToggle: () => void;
  onPortionChange: (portion: number) => void;
}

function ItemRow({ item, selected, dupeColor, currencySymbol, portion, onToggle, onPortionChange }: ItemRowProps) {
  const [customActive, setCustomActive] = useState(false);
  const [customDen, setCustomDen] = useState(2);

  const portionKey: PortionKey = customActive
    ? 'custom'
    : portion >= 0.999
    ? 'full'
    : Math.abs(portion - 0.5) < 0.001
    ? 'half'
    : Math.abs(portion - 1 / 3) < 0.001
    ? 'third'
    : 'custom';

  const effectivePrice = item.price * Math.min(portion, 1);

  function handlePreset(key: PortionKey) {
    setCustomActive(key === 'custom');
    if (key === 'full') onPortionChange(1);
    else if (key === 'half') onPortionChange(0.5);
    else if (key === 'third') onPortionChange(1 / 3);
    else onPortionChange(Math.min(1 / Math.max(customDen, 1), 1));
  }

  function handleCustomDenChange(den: number) {
    const d = Math.max(1, den);
    setCustomDen(d);
    onPortionChange(1 / d);
  }

  const borderStyle = dupeColor ? { borderColor: dupeColor, borderWidth: '3px' } : undefined;

  return (
    <div
      className={[
        'rounded-3xl border overflow-hidden transition-all duration-150',
        selected ? 'shadow-glow-sm' : 'shadow-card',
        !dupeColor && selected ? 'bg-accent/15 border-accent/30' : '',
        !dupeColor && !selected ? 'bg-surface-card border-surface-border' : '',
        dupeColor && selected ? 'bg-accent/15' : '',
        dupeColor && !selected ? 'bg-surface-card' : '',
      ].join(' ')}
      style={borderStyle}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3.5 gap-3 text-right active:scale-[0.98]"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
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
          <span className={['font-medium leading-snug truncate', selected ? 'text-white' : 'text-white/80'].join(' ')}>
            {item.name}
          </span>
        </div>

        <div className="flex flex-col items-end shrink-0">
          {selected && portion < 0.999 && (
            <span className="text-white/30 text-xs tabular-nums line-through leading-none mb-0.5">
              {currencySymbol}{item.price.toFixed(2)}
            </span>
          )}
          <span className={['font-semibold text-lg tabular-nums', selected ? 'text-accent' : 'text-accent/70'].join(' ')}>
            {currencySymbol}{effectivePrice.toFixed(2)}
          </span>
        </div>
      </button>

      {selected && (
        <div className="px-3 pb-3 pt-0 border-t border-white/10 bg-black/10">
          <div className="flex gap-1.5 pt-2">
            {(['full', 'half', 'third', 'custom'] as const).map((key) => {
              const labels: Record<PortionKey, string> = { full: 'סכום מלא', half: '½', third: '⅓', custom: 'מותאם' };
              const labelClass: Record<PortionKey, string> = { full: 'text-xs', half: 'text-base', third: 'text-base', custom: 'text-xs' };
              return (
                <button
                  key={key}
                  onClick={() => handlePreset(key)}
                  className={[
                    'flex-1 py-1.5 rounded-xl font-semibold transition-colors',
                    labelClass[key],
                    portionKey === key
                      ? 'bg-accent text-white'
                      : 'bg-surface-elevated text-white/50 hover:text-white/70',
                  ].join(' ')}
                >
                  {labels[key]}
                </button>
              );
            })}
          </div>

          {portionKey === 'custom' && (
            <div className="flex items-center justify-center gap-2 mt-2" dir="ltr">
              <span className="text-white/60 text-sm font-medium">1</span>
              <span className="text-white/40 text-sm">/</span>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                value={customDen}
                onChange={(e) => handleCustomDenChange(parseInt(e.target.value) || 1)}
                className="w-14 text-center bg-surface-elevated border border-surface-border rounded-xl py-1 text-white text-sm outline-none focus:border-accent/50"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ItemList({ items, currency, warnings, selectedIds, onToggle, portions, onPortionChange }: ItemListProps) {
  const total = items.reduce((sum, item) => sum + item.price, 0);
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
            <span className="text-white/60 text-sm font-semibold uppercase tracking-wider">
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
              portion={portions?.get(item.id) ?? 1}
              onToggle={() => onToggle(item.id)}
              onPortionChange={(p) => onPortionChange?.(item.id, p)}
            />
          ))}
        </div>
      ))}

      <div className="h-px bg-surface-border" />

      <Card glow className="flex items-center justify-between px-4 py-4">
        <span className="text-white/70 font-medium">סה״כ</span>
        <span className="text-white font-bold text-xl tabular-nums">
          {currencySymbol}{total.toFixed(2)}
        </span>
      </Card>
    </div>
  );
}
