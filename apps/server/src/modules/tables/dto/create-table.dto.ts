import { CreateTableRequestSchema } from '@bill/shared';
import { z } from 'zod';

export type CreateTableDto = z.infer<typeof CreateTableRequestSchema>;
export { CreateTableRequestSchema };
