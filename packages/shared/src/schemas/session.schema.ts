import { z } from 'zod';

export const DinerSchema = z.object({
  dinerId: z.string().uuid(),
  animal: z.string(),
  name: z.string().optional(),
  isAdmin: z.boolean(),
  selectedItemIds: z.array(z.string()),
  isDone: z.boolean(),
});

export type Diner = z.infer<typeof DinerSchema>;

export const DinerResultSchema = z.object({
  dinerId: z.string().uuid(),
  animal: z.string(),
  name: z.string().optional(),
  selectedItemIds: z.array(z.string()),
  total: z.number(),
});

export type DinerResult = z.infer<typeof DinerResultSchema>;

export const CalculationResultSchema = z.object({
  dinerResults: z.array(DinerResultSchema),
  currency: z.string(),
  calculatedAt: z.string(),
});

export type CalculationResult = z.infer<typeof CalculationResultSchema>;

export const SessionStateSchema = z.object({
  tableId: z.string(),
  diners: z.array(DinerSchema),
  itemReductions: z.record(z.string(), z.number()).default({}),
  results: CalculationResultSchema.optional(),
});

export type SessionState = z.infer<typeof SessionStateSchema>;

export const JoinTablePayloadSchema = z.object({
  tableId: z.string(),
  isAdmin: z.boolean(),
  name: z.string().optional(),
});

export type JoinTablePayload = z.infer<typeof JoinTablePayloadSchema>;

export const ToggleItemPayloadSchema = z.object({
  itemId: z.string(),
});

export type ToggleItemPayload = z.infer<typeof ToggleItemPayloadSchema>;

export const ReduceItemPayloadSchema = z.object({
  itemId: z.string(),
  amount: z.number().nonnegative(),
});

export type ReduceItemPayload = z.infer<typeof ReduceItemPayloadSchema>;
