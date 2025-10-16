// Mode-specific configuration schema
// Extracted from main config for better maintainability

import { z } from 'zod';

export const ModesSchema = z.object({
  functional: z.object({
    requireTdd: z.boolean(),
    requireDiffCoverage: z.boolean(),
    requireTests: z.boolean(),
  }),
  nonFunctional: z.object({
    requireProblemAnalysis: z.boolean(),
    requireProblemAnalysisMinLength: z.number().min(0),
    requireTdd: z.boolean(),
    requireDiffCoverage: z.boolean(),
    requireTests: z.boolean(),
  }),
});

export type ModesConfig = z.infer<typeof ModesSchema>;
