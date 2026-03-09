import { z } from 'zod';

export const CreateTableRequestSchema = z.object({
  groupName: z.string().min(1).max(100),
});

export const TableSchema = z.object({
  tableId: z.string().uuid(),
  groupName: z.string(),
  createdAt: z.string().datetime(),
});

export type CreateTableRequest = z.infer<typeof CreateTableRequestSchema>;
export type Table = z.infer<typeof TableSchema>;
