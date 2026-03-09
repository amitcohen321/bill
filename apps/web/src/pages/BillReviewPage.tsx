import { useState } from 'react';
import { useLocation, useParams, Navigate, useNavigate } from 'react-router-dom';
import type { BillExtractionResponse } from '@bill/shared';
import { PageLayout } from '../components/ui/PageLayout';
import { ItemList } from '../features/bill-review/ItemList';
import { QRShare } from '../features/bill-review/QRShare';
import { TipSelector } from '../features/bill-review/TipSelector';
import { SelectionBar } from '../features/bill-review/SelectionBar';
import { Button } from '../components/ui/Button';
import { isManager } from '../lib/manager';

interface LocationState {
  extraction: BillExtractionResponse;
}

export function BillReviewPage() {
  const { tableId } = useParams<{ tableId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state as LocationState | null;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [tipPercent, setTipPercent] = useState(0);

  if (!tableId || !state?.extraction) {
    return <Navigate to="/" replace />;
  }

  const { extraction } = state;

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

  const selectedTotal = extraction.items
    .filter((item) => selectedIds.has(item.id))
    .reduce((sum, item) => sum + item.price, 0);

  return (
    <>
      <PageLayout showBack title="סקירת חשבון">
        {/* Extra bottom padding so content isn't hidden behind the floating bar */}
        <div className="flex flex-col gap-6 mt-6 pb-32">
          <div>
            <h2 className="text-2xl font-bold text-white">פריטים בחשבון</h2>
            <p className="text-white/50 mt-1">
              זוהו {extraction.items.length} פריטים · לחץ לבחירה
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

          <QRShare tableId={tableId} />

          {isManager(tableId) && (
            <div className="flex flex-col gap-3 pt-2">
              <Button
                variant="secondary"
                size="md"
                fullWidth
                onClick={() => navigate(`/tables/${tableId}/scan`)}
              >
                צלם שוב
              </Button>
            </div>
          )}
        </div>
      </PageLayout>

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
    </>
  );
}
