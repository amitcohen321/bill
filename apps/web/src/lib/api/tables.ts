import type { Table, BillExtractionResponse } from '@bill/shared';
import { post, postFormData, get } from './client';

export function createTable(): Promise<Table> {
  return post<Table>('/tables');
}

export function getTable(tableId: string): Promise<Table> {
  return get<Table>(`/tables/${tableId}`);
}

export function getTableByCode(code: string): Promise<Table> {
  return get<Table>(`/tables/by-code/${code}`);
}

export function uploadBillImage(tableId: string, imageFile: File): Promise<BillExtractionResponse> {
  const formData = new FormData();
  formData.append('image', imageFile);
  return postFormData<BillExtractionResponse>(`/tables/${tableId}/bill-image`, formData);
}
