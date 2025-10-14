// Threshold configuration schema
// Extracted from main config for better maintainability

import { z } from 'zod';

export const ThresholdsSchema = z.object({
  diffCoverageFunctional: z.number().min(0).max(100),
  diffCoverageFunctionalRefactor: z.number().min(0).max(100),
  globalCoverage: z.number().min(0).max(100),
  maxWarnings: z.number().min(0),
  maxCommitSize: z.number().min(1),
});

export type ThresholdsConfig = z.infer<typeof ThresholdsSchema>;
