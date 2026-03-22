import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { HomePage } from '../pages/HomePage';
import { CreateTablePage } from '../pages/CreateTablePage';
import { BillScanPage } from '../pages/BillScanPage';
import { GuestTablePage } from '../pages/GuestTablePage';

function ReviewRedirect() {
  const { tableId } = useParams<{ tableId: string }>();
  return <Navigate to={`/tables/${tableId}`} replace />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/create-table" element={<CreateTablePage />} />
      <Route path="/tables/:tableId" element={<GuestTablePage />} />
      <Route path="/tables/:tableId/scan" element={<BillScanPage />} />
      <Route path="/tables/:tableId/review" element={<ReviewRedirect />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
