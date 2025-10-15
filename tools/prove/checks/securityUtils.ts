/**
 * Security check utilities for npm audit parsing and analysis
 */

export interface AuditVulnerability {
  name: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  title: string;
  url: string;
  range: string;
  vulnerable_versions: string;
  patched_versions: string;
  dependency_of: string;
  overview: string;
  recommendation: string;
}

export interface AuditMetadata {
  vulnerabilities: {
    [key: string]: AuditVulnerability;
  };
  metadata: {
    vulnerabilities: {
      info: number;
      low: number;
      moderate: number;
      high: number;
      critical: number;
      total: number;
    };
  };
}

export interface SecuritySummary {
  totalVulnerabilities: number;
  highSeverity: number;
  criticalSeverity: number;
  vulnerabilities: AuditVulnerability[];
}

/**
 * Parse npm audit JSON output
 */
export function parseAuditJson(auditOutput: string): AuditMetadata {
  try {
    const parsed = JSON.parse(auditOutput);
    return parsed as AuditMetadata;
  } catch (error) {
    throw new Error(`Failed to parse npm audit JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Summarize high and critical vulnerabilities from audit data
 */
export function summarizeHighSeverity(auditData: AuditMetadata): SecuritySummary {
  const vulnerabilities = Object.values(auditData.vulnerabilities);
  
  const highSeverity = vulnerabilities.filter(v => v.severity === 'high');
  const criticalSeverity = vulnerabilities.filter(v => v.severity === 'critical');
  
  return {
    totalVulnerabilities: auditData.metadata.vulnerabilities.total,
    highSeverity: highSeverity.length,
    criticalSeverity: criticalSeverity.length,
    vulnerabilities: [...highSeverity, ...criticalSeverity]
  };
}

/**
 * Format vulnerability details for reporting
 */
export function formatVulnerabilityDetails(vulnerability: AuditVulnerability): string {
  return [
    `- **${vulnerability.name}** (${vulnerability.severity.toUpperCase()})`,
    `  - Title: ${vulnerability.title}`,
    `  - Range: ${vulnerability.range}`,
    `  - Patched: ${vulnerability.patched_versions}`,
    `  - Dependency of: ${vulnerability.dependency_of}`,
    `  - Recommendation: ${vulnerability.recommendation}`,
    `  - URL: ${vulnerability.url}`
  ].join('\n');
}

/**
 * Check if audit data contains high or critical vulnerabilities
 */
export function hasHighSeverityVulnerabilities(auditData: AuditMetadata): boolean {
  const summary = summarizeHighSeverity(auditData);
  return summary.highSeverity > 0 || summary.criticalSeverity > 0;
}

/**
 * Generate a detailed security report
 */
export function generateSecurityReport(auditData: AuditMetadata): string {
  const summary = summarizeHighSeverity(auditData);
  
  if (summary.highSeverity === 0 && summary.criticalSeverity === 0) {
    return 'No high or critical vulnerabilities found.';
  }
  
  const report = [
    `Found ${summary.highSeverity} high and ${summary.criticalSeverity} critical vulnerabilities:`,
    ''
  ];
  
  summary.vulnerabilities.forEach(vuln => {
    report.push(formatVulnerabilityDetails(vuln));
  });
  
  return report.join('\n');
}
