// Path configuration schema
// Extracted from main config for better maintainability

import { z } from 'zod';

export const PathsSchema = z.object({
  srcGlobs: z.array(z.string()),
  testGlobs: z.array(z.string()),
  coverageFile: z.string(),
  proveReportFile: z.string(),
});

export type PathsConfig = z.infer<typeof PathsSchema>;
