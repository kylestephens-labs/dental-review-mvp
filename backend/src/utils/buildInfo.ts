/**
 * Build information utilities
 * Provides commit SHA from various environment sources
 */

export function getCommitSha(): string {
  // Priority order as specified in implementation notes
  return process.env.COMMIT_SHA || 
         process.env.VERCEL_GIT_COMMIT_SHA || 
         process.env.GIT_SHA || 
         'dev';
}
