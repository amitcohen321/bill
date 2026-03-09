import { z } from 'zod';

export const BillItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number().nonnegative(),
});

export const BillExtractionResponseSchema = z.object({
  tableId: z.string(),
  items: z.array(BillItemSchema),
  currency: z.string().default('ILS'),
  rawText: z.string().optional(),
  warnings: z.array(z.string()).default([]),
});

export const OpenAIExtractionResultSchema = z.object({
  items: z.array(
    z.object({
      name: z.string(),
      price: z.number().nonnegative(),
    }),
  ),
  currency: z.string().optional(),
  warnings: z.array(z.string()).optional(),
});

export type BillItem = z.infer<typeof BillItemSchema>;
export type BillExtractionResponse = z.infer<typeof BillExtractionResponseSchema>;
export type OpenAIExtractionResult = z.infer<typeof OpenAIExtractionResultSchema>;
