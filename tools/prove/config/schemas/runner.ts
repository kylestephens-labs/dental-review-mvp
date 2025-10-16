// Runner configuration schema
// Extracted from main config for better maintainability

import { z } from 'zod';

export const RunnerSchema = z.object({
  concurrency: z.number().min(1).max(20),
  timeout: z.number().min(1000),
  failFast: z.boolean(),
});

export type RunnerConfig = z.infer<typeof RunnerSchema>;
