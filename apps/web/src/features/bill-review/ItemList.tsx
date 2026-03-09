import type { BillItem } from '@bill/shared';
import { Card } from '../../components/ui/Card';

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
}

export function ItemList({ items, currency, warnings, selectedIds, onToggle }: ItemListProps) {
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

      <div className="flex flex-col gap-2">
        {items.map((item) => {
          const selected = selectedIds.has(item.id);
          const dupeColor = dupeColors.get(item.id);
          return (
            <button
              key={item.id}
              onClick={() => onToggle(item.id)}
              className={[
                'w-full flex items-center justify-between px-4 py-3.5 gap-3 rounded-3xl border transition-all duration-150 text-right',
                'active:scale-[0.98]',
                selected
                  ? 'bg-accent/15 shadow-glow-sm'
                  : 'bg-surface-card shadow-card',
              ].join(' ')}
              style={dupeColor
                ? { borderColor: dupeColor, borderWidth: '2px' }
                : undefined
              }
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
              <span className={['font-semibold text-lg shrink-0 tabular-nums', selected ? 'text-accent' : 'text-accent/70'].join(' ')}>
                {currencySymbol}{item.price.toFixed(2)}
              </span>
            </button>
          );
        })}
      </div>

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
