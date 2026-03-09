import type { BillItem } from '@bill/shared';
import { Card } from '../../components/ui/Card';

interface ItemListProps {
  items: BillItem[];
  currency: string;
  warnings: string[];
}

export function ItemList({ items, currency, warnings }: ItemListProps) {
  const total = items.reduce((sum, item) => sum + item.price, 0);
  const currencySymbol = currency === 'ILS' ? '₪' : currency;

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
        {items.map((item) => (
          <Card key={item.id} className="flex items-center justify-between px-4 py-3.5 gap-3">
            <span className="text-white font-medium leading-snug flex-1 min-w-0 truncate">
              {item.name}
            </span>
            <span className="text-accent font-semibold text-lg shrink-0 tabular-nums">
              {currencySymbol}
              {item.price.toFixed(2)}
            </span>
          </Card>
        ))}
      </div>

      <div className="h-px bg-surface-border" />

      <Card
        glow
        className="flex items-center justify-between px-4 py-4"
      >
        <span className="text-white/70 font-medium">סה״כ</span>
        <span className="text-white font-bold text-xl tabular-nums">
          {currencySymbol}
          {total.toFixed(2)}
        </span>
      </Card>
    </div>
  );
}
