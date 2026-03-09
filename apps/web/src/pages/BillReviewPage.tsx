import { useLocation, useParams, Navigate, useNavigate } from 'react-router-dom';
import type { BillExtractionResponse } from '@bill/shared';
import { PageLayout } from '../components/ui/PageLayout';
import { ItemList } from '../features/bill-review/ItemList';
import { Button } from '../components/ui/Button';

interface LocationState {
  extraction: BillExtractionResponse;
}

export function BillReviewPage() {
  const { tableId } = useParams<{ tableId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state as LocationState | null;

  if (!tableId || !state?.extraction) {
    return <Navigate to="/" replace />;
  }

  const { extraction } = state;

  return (
    <PageLayout showBack title="סקירת חשבון">
      <div className="flex flex-col gap-6 mt-6">
        <div>
          <h2 className="text-2xl font-bold text-white">פריטים בחשבון</h2>
          <p className="text-white/50 mt-1">
            זוהו {extraction.items.length} פריטים
          </p>
        </div>

        <ItemList
          items={extraction.items}
          currency={extraction.currency}
          warnings={extraction.warnings}
        />

        <div className="flex flex-col gap-3 pt-2">
          <Button
            size="lg"
            fullWidth
            onClick={() => {
              // Splitting logic will be added here
              alert('פיצול יתווסף בקרוב!');
            }}
          >
            חלק את החשבון
          </Button>
          <Button
            variant="secondary"
            size="md"
            fullWidth
            onClick={() => navigate(`/tables/${tableId}/scan`)}
          >
            צלם שוב
          </Button>
        </div>
      </div>
    </PageLayout>
  );
}
