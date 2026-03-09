import { useParams, Navigate } from 'react-router-dom';
import { PageLayout } from '../components/ui/PageLayout';
import { BillCapture } from '../features/bill-scan/BillCapture';

export function BillScanPage() {
  const { tableId } = useParams<{ tableId: string }>();

  if (!tableId) return <Navigate to="/" replace />;

  return (
    <PageLayout showBack title="סריקת חשבון">
      <div className="flex flex-col gap-6 mt-6">
        <div>
          <h2 className="text-2xl font-bold text-white">צלם את החשבון</h2>
          <p className="text-white/50 mt-1">וודא שהחשבון מוצג בצורה ברורה</p>
        </div>
        <BillCapture tableId={tableId} />
      </div>
    </PageLayout>
  );
}
