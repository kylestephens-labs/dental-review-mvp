// Toggle configuration schema
// Extracted from main config for better maintainability

import { z } from 'zod';

export const TogglesSchema = z.object({
  coverage: z.boolean(),
  diffCoverage: z.boolean(),
  sizeBudget: z.boolean(),
  security: z.boolean(),
  contracts: z.boolean(),
  dbMigrations: z.boolean(),
  tdd: z.boolean().optional(),
});

export type TogglesConfig = z.infer<typeof TogglesSchema>;
