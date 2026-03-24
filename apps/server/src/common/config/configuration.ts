import { z } from 'zod';

const EnvSchema = z.object({
  PORT: z
    .string()
    .optional()
    .default('3001')
    .transform((v) => parseInt(v, 10)),
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),
  GEMINI_MODEL: z.string().optional().default('gemini-3-flash-preview'),
  NODE_ENV: z.enum(['development', 'production', 'test']).optional().default('development'),
});

export type AppConfig = z.infer<typeof EnvSchema>;

export function validateConfig(config: Record<string, unknown>): AppConfig {
  const result = EnvSchema.safeParse(config);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Configuration validation failed:\n${issues}`);
  }
  return result.data;
}

export const configuration = () => validateConfig(process.env as Record<string, unknown>);
