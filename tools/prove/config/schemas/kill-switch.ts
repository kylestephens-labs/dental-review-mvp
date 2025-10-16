// Kill-switch configuration schema
// Extracted from main config for better maintainability

import { z } from 'zod';

export const KillSwitchSchema = z.object({
  enableRegistrationValidation: z.boolean(),
  enableEnhancedPatterns: z.boolean(),
  enableSharedDetection: z.boolean(),
  enableRolloutValidation: z.boolean(),
  enableErrorMessages: z.boolean(),
  patternDetectionTimeout: z.number().min(1000).max(30000),
});

export type KillSwitchConfig = z.infer<typeof KillSwitchSchema>;
