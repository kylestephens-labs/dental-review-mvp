import { describe, it, expect } from 'vitest';
import { 
  parseAuditJson, 
  summarizeHighSeverity, 
  hasHighSeverityVulnerabilities, 
  generateSecurityReport,
  type AuditMetadata 
} from '../../checks/securityUtils.js';

describe('securityUtils', () => {
  const mockAuditData: AuditMetadata = {
    vulnerabilities: {
      'lodash-1': {
        name: 'lodash',
        severity: 'high',
        title: 'Prototype Pollution in lodash',
        url: 'https://github.com/advisories/GHSA-29mw-w4m2-2h7x',
        range: '>=4.17.0 <4.17.12',
        vulnerable_versions: '4.17.0 - 4.17.11',
        patched_versions: '>=4.17.12',
        dependency_of: 'webpack',
        overview: 'A prototype pollution vulnerability exists in lodash',
        recommendation: 'Upgrade to lodash@4.17.12 or later'
      },
      'lodash-2': {
        name: 'lodash',
        severity: 'critical',
        title: 'Command Injection in lodash',
        url: 'https://github.com/advisories/GHSA-29mw-w4m2-2h8y',
        range: '>=4.17.0 <4.17.15',
        vulnerable_versions: '4.17.0 - 4.17.14',
        patched_versions: '>=4.17.15',
        dependency_of: 'webpack',
        overview: 'A command injection vulnerability exists in lodash',
        recommendation: 'Upgrade to lodash@4.17.15 or later'
      },
      'minimist-1': {
        name: 'minimist',
        severity: 'moderate',
        title: 'Prototype Pollution in minimist',
        url: 'https://github.com/advisories/GHSA-29mw-w4m2-2h9z',
        range: '>=1.0.0 <1.2.3',
        vulnerable_versions: '1.0.0 - 1.2.2',
        patched_versions: '>=1.2.3',
        dependency_of: 'webpack',
        overview: 'A prototype pollution vulnerability exists in minimist',
        recommendation: 'Upgrade to minimist@1.2.3 or later'
      }
    },
    metadata: {
      vulnerabilities: {
        info: 0,
        low: 0,
        moderate: 1,
        high: 1,
        critical: 1,
        total: 3
      }
    }
  };

  const cleanAuditData: AuditMetadata = {
    vulnerabilities: {},
    metadata: {
      vulnerabilities: {
        info: 0,
        low: 0,
        moderate: 0,
        high: 0,
        critical: 0,
        total: 0
      }
    }
  };

  describe('parseAuditJson', () => {
    it('should parse valid audit JSON', () => {
      const jsonString = JSON.stringify(mockAuditData);
      const result = parseAuditJson(jsonString);
      
      expect(result).toEqual(mockAuditData);
    });

    it('should throw error for invalid JSON', () => {
      expect(() => parseAuditJson('invalid json')).toThrow('Failed to parse npm audit JSON');
    });

    it('should throw error for empty string', () => {
      expect(() => parseAuditJson('')).toThrow('Failed to parse npm audit JSON');
    });
  });

  describe('summarizeHighSeverity', () => {
    it('should correctly summarize high and critical vulnerabilities', () => {
      const summary = summarizeHighSeverity(mockAuditData);
      
      expect(summary.totalVulnerabilities).toBe(3);
      expect(summary.highSeverity).toBe(1);
      expect(summary.criticalSeverity).toBe(1);
      expect(summary.vulnerabilities).toHaveLength(2);
      expect(summary.vulnerabilities[0].severity).toBe('high');
      expect(summary.vulnerabilities[1].severity).toBe('critical');
    });

    it('should return zero counts for clean audit data', () => {
      const summary = summarizeHighSeverity(cleanAuditData);
      
      expect(summary.totalVulnerabilities).toBe(0);
      expect(summary.highSeverity).toBe(0);
      expect(summary.criticalSeverity).toBe(0);
      expect(summary.vulnerabilities).toHaveLength(0);
    });
  });

  describe('hasHighSeverityVulnerabilities', () => {
    it('should return true when high/critical vulnerabilities exist', () => {
      expect(hasHighSeverityVulnerabilities(mockAuditData)).toBe(true);
    });

    it('should return false when no high/critical vulnerabilities exist', () => {
      expect(hasHighSeverityVulnerabilities(cleanAuditData)).toBe(false);
    });
  });

  describe('generateSecurityReport', () => {
    it('should generate detailed report for vulnerabilities', () => {
      const report = generateSecurityReport(mockAuditData);
      
      expect(report).toContain('Found 1 high and 1 critical vulnerabilities');
      expect(report).toContain('**lodash** (HIGH)');
      expect(report).toContain('**lodash** (CRITICAL)');
      expect(report).toContain('Title: Prototype Pollution in lodash');
      expect(report).toContain('Title: Command Injection in lodash');
      expect(report).toContain('Recommendation: Upgrade to lodash@4.17.12 or later');
      expect(report).toContain('Recommendation: Upgrade to lodash@4.17.15 or later');
    });

    it('should return simple message for no vulnerabilities', () => {
      const report = generateSecurityReport(cleanAuditData);
      
      expect(report).toBe('No high or critical vulnerabilities found.');
    });
  });
});
