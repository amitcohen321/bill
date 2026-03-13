import { z } from 'zod';
import { BillItemSchema } from './bill.schema';

export const ExtractionSnapshotSchema = z.object({
  items: z.array(BillItemSchema),
  currency: z.string(),
  warnings: z.array(z.string()),
});

export const TableSchema = z.object({
  tableId: z.string().uuid(),
  createdAt: z.string().datetime(),
  code: z.string().length(4),
  extraction: ExtractionSnapshotSchema.optional(),
});

export type ExtractionSnapshot = z.infer<typeof ExtractionSnapshotSchema>;
export type Table = z.infer<typeof TableSchema>;
