// Feature flags configuration schema
// Extracted from main config for better maintainability

import { z } from 'zod';

export const FeatureFlagsSchema = z.object({
  enableTelemetry: z.boolean(),
  enableRolloutValidation: z.boolean(),
  enableSharedDetection: z.boolean(),
  registryCacheTimeout: z.number().min(1000).max(300000),
  detectionTimeout: z.number().min(1000).max(60000),
  enableGradualRolloutValidation: z.boolean(),
  enableFlagRegistrationValidation: z.boolean(),
});

export type FeatureFlagsConfig = z.infer<typeof FeatureFlagsSchema>;
