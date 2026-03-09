import type { Table, BillExtractionResponse, CreateTableRequest } from '@bill/shared';
import { post, postFormData } from './client';

export function createTable(data: CreateTableRequest): Promise<Table> {
  return post<Table>('/tables', data);
}

export function uploadBillImage(tableId: string, imageFile: File): Promise<BillExtractionResponse> {
  const formData = new FormData();
  formData.append('image', imageFile);
  return postFormData<BillExtractionResponse>(`/tables/${tableId}/bill-image`, formData);
}
