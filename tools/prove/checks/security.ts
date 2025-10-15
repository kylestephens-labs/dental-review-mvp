// Security vulnerability check
// Scans for high/critical vulnerabilities using npm audit

import { exec } from '../utils/exec.js';
import type { ProveContext } from '../context.js';
import { parseAuditJson, summarizeHighSeverity, hasHighSeverityVulnerabilities, generateSecurityReport } from './securityUtils.js';

export async function checkSecurity(context: ProveContext): Promise<{ ok: boolean; reason?: string; details?: string }> {
  const { cfg, log } = context;

  // Skip if security toggle is disabled
  if (!cfg.toggles.security) {
    log.info('Security check skipped (toggle disabled)');
    return { ok: true, reason: 'Security check disabled' };
  }

  log.info('Running security vulnerability scan...');

  try {
    // Run npm audit with high/critical level
    const result = await exec('npm', ['audit', '--audit-level=high', '--json'], {
      timeout: cfg.checkTimeouts.tests, // Use tests timeout as security scan can take time
      cwd: process.cwd(),
    });

    if (result.code !== 0) {
      // Parse the JSON output to get vulnerability details
      let auditData;
      try {
        auditData = parseAuditJson(result.stdout);
      } catch (parseError) {
        log.warn('Failed to parse npm audit JSON output', { error: parseError });
        return {
          ok: false,
          reason: 'Security scan failed - could not parse results',
          details: `npm audit failed with exit code ${result.code}\n\nSTDOUT:\n${result.stdout}\n\nSTDERR:\n${result.stderr}`
        };
      }

      // Check for high/critical vulnerabilities using utilities
      if (hasHighSeverityVulnerabilities(auditData)) {
        const summary = summarizeHighSeverity(auditData);
        const report = generateSecurityReport(auditData);

        return {
          ok: false,
          reason: `Found ${summary.highSeverity} high and ${summary.criticalSeverity} critical vulnerabilities`,
          details: `${report}\n\nRun 'npm audit fix' to attempt automatic fixes, or 'npm audit' for details.`
        };
      }

      // If we get here, there might be other issues (like network problems)
      return {
        ok: false,
        reason: 'Security scan failed with unknown error',
        details: `npm audit failed with exit code ${result.code}\n\nSTDOUT:\n${result.stdout}\n\nSTDERR:\n${result.stderr}`
      };
    }

    // Success - no high/critical vulnerabilities found
    log.info('Security scan passed - no high/critical vulnerabilities found');
    return { ok: true, reason: 'No high/critical vulnerabilities found' };

  } catch (error) {
    log.error('Security check failed with error', { error: error instanceof Error ? error.message : String(error) });
    return {
      ok: false,
      reason: 'Security check failed with error',
      details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}
