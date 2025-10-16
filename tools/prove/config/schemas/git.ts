// Git configuration schema
// Extracted from main config for better maintainability

import { z } from 'zod';

export const GitSchema = z.object({
  baseRefFallback: z.string().min(1),
  requireMainBranch: z.boolean(),
  enablePreConflictCheck: z.boolean(),
});

export type GitConfig = z.infer<typeof GitSchema>;
