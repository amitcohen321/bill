interface SelectionBarProps {
  count: number;
  selectedSum: number;
  currency: string;
}

export function SelectionBar({ count, selectedSum, currency }: SelectionBarProps) {
  const visible = count > 0;

  return (
    <div
      className={[
        'fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-3 transition-all duration-300 ease-out pointer-events-none',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0',
      ].join(' ')}
    >
      <div className="pointer-events-auto rounded-3xl border border-accent/30 bg-surface-elevated/90 backdrop-blur-xl shadow-glow px-5 py-4 flex items-center justify-between">
        <p className="text-white/60 text-sm font-medium">
          {count} {count === 1 ? 'פריט' : 'פריטים'} נבחרו
        </p>
        <p className="text-white text-lg font-bold">
          {currency}{selectedSum.toFixed(2)}
        </p>
      </div>
    </div>
  );
}
