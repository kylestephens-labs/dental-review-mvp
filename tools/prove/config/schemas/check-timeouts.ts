// Check timeouts configuration schema
// Extracted from main config for better maintainability

import { z } from 'zod';

export const CheckTimeoutsSchema = z.object({
  typecheck: z.number().min(1000),
  lint: z.number().min(1000),
  tests: z.number().min(1000),
  build: z.number().min(1000),
  coverage: z.number().min(1000),
});

export type CheckTimeoutsConfig = z.infer<typeof CheckTimeoutsSchema>;
