import { useParams, Navigate } from 'react-router-dom';

export function BillReviewPage() {
  const { tableId } = useParams<{ tableId: string }>();
  if (!tableId) return <Navigate to="/" replace />;
  return <Navigate to={`/tables/${tableId}`} replace />;
}
