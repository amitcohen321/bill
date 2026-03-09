import { Routes, Route, Navigate } from 'react-router-dom';
import { HomePage } from '../pages/HomePage';
import { CreateTablePage } from '../pages/CreateTablePage';
import { BillScanPage } from '../pages/BillScanPage';
import { BillReviewPage } from '../pages/BillReviewPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/create-table" element={<CreateTablePage />} />
      <Route path="/tables/:tableId/scan" element={<BillScanPage />} />
      <Route path="/tables/:tableId/review" element={<BillReviewPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
