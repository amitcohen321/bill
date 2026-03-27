import { useParams, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PageLayout } from '../components/ui/PageLayout';
import { BillCapture } from '../features/bill-scan/BillCapture';
import { getAdminToken } from '../lib/manager';
import { getTable } from '../lib/api/tables';

export function BillScanPage() {
  const { tableId } = useParams<{ tableId: string }>();

  const { data: table } = useQuery({
    queryKey: ['table', tableId],
    queryFn: () => getTable(tableId!),
    enabled: !!tableId,
  });

  if (!tableId) return <Navigate to="/" replace />;
  if (!getAdminToken(tableId)) return <Navigate to={`/tables/${tableId}`} replace />;

  return (
    <PageLayout showBack title="סריקת חשבון">
      <div className="flex flex-col gap-6 mt-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">צלם את החשבון</h2>
            <p className="text-white/50 mt-1">וודא שהחשבון מוצג בצורה ברורה</p>
            <p className="text-white/50 mt-0.5 text-base">מומלץ להשתמש בפלאש לתאורה טובה יותר</p>
          </div>

          {table?.code && (
            <div className="flex flex-col items-center rounded-2xl bg-surface-card border border-surface-border px-4 py-2.5 shrink-0">
              <span className="text-white/40 text-xs font-medium">קוד הצטרפות לשולחן</span>
              <span className="text-white font-bold text-2xl tabular-nums tracking-[0.2em]">
                {table.code}
              </span>
            </div>
          )}
        </div>

        <BillCapture tableId={tableId} />
      </div>
    </PageLayout>
  );
}
