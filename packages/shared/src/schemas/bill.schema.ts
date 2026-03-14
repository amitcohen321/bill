import { z } from 'zod';

export const ItemCategorySchema = z.enum(['starter', 'main', 'dessert', 'drink', 'other']);
export type ItemCategory = z.infer<typeof ItemCategorySchema>;

export const ITEM_CATEGORIES: ItemCategory[] = ['starter', 'main', 'dessert', 'drink', 'other'];

export const BillItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number().nonnegative(),
  category: ItemCategorySchema.default('other'),
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
      category: ItemCategorySchema.default('other'),
    }),
  ),
  currency: z.string().optional(),
  warnings: z.array(z.string()).optional(),
});

export type BillItem = z.infer<typeof BillItemSchema>;
export type BillExtractionResponse = z.infer<typeof BillExtractionResponseSchema>;
export type OpenAIExtractionResult = z.infer<typeof OpenAIExtractionResultSchema>;
