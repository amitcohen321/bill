import { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PageLayout } from '../components/ui/PageLayout';
import { ItemList } from '../features/bill-review/ItemList';
import { TipSelector } from '../features/bill-review/TipSelector';
import { SelectionBar } from '../features/bill-review/SelectionBar';
import { getTable } from '../lib/api/tables';
import { isManager } from '../lib/manager';

export function GuestTablePage() {
  const { tableId } = useParams<{ tableId: string }>();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [tipPercent, setTipPercent] = useState(0);

  if (!tableId) return <Navigate to="/" replace />;
  // Manager should use the full review flow, not this page
  if (isManager(tableId)) return <Navigate to={`/tables/${tableId}/scan`} replace />;

  const { data: table, isLoading, isError } = useQuery({
    queryKey: ['table', tableId],
    queryFn: () => getTable(tableId),
    retry: 1,
  });

  function handleToggle(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  const extraction = table?.extraction;

  const selectedTotal = (extraction?.items ?? [])
    .filter((item) => selectedIds.has(item.id))
    .reduce((sum, item) => sum + item.price, 0);

  return (
    <>
      <PageLayout title={table?.groupName ?? 'שולחן'}>
        <div className="flex flex-col gap-6 mt-6 pb-32">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
              <p className="text-white/40 text-sm">טוען את השולחן...</p>
            </div>
          )}

          {isError && (
            <div className="rounded-2xl bg-red-950 border border-red-800/50 p-6 text-center">
              <p className="text-red-300 font-medium">לא ניתן למצוא את השולחן</p>
              <p className="text-red-400/60 text-sm mt-1">ודא שהקישור תקין ונסה שוב</p>
            </div>
          )}

          {table && !extraction && (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
              <div className="text-5xl">⏳</div>
              <p className="text-white font-semibold text-lg">ממתין לסריקת החשבון</p>
              <p className="text-white/40 text-sm">מנהל השולחן עוד לא סרק את החשבון</p>
            </div>
          )}

          {extraction && (
            <>
              <div>
                <h2 className="text-2xl font-bold text-white">בחר את הפריטים שלך</h2>
                <p className="text-white/50 mt-1">
                  {extraction.items.length} פריטים · לחץ לבחירה
                </p>
              </div>

              <ItemList
                items={extraction.items}
                currency={extraction.currency}
                warnings={extraction.warnings}
                selectedIds={selectedIds}
                onToggle={handleToggle}
              />

              <TipSelector tipPercent={tipPercent} onTipChange={setTipPercent} />
            </>
          )}
        </div>
      </PageLayout>

      {extraction && (
        <SelectionBar
          count={selectedIds.size}
          subtotal={selectedTotal}
          tipPercent={tipPercent}
          currency={extraction.currency}
          onApprove={() => {
            const grandTotal = selectedTotal * (1 + tipPercent / 100);
            alert(`אישרת ${selectedIds.size} פריטים בסך ${grandTotal.toFixed(2)}`);
          }}
        />
      )}
    </>
  );
}
