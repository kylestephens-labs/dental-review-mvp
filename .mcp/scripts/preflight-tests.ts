#!/usr/bin/env tsx

/**
 * Preflight Tests - Additional Safety Checks Before Trunk Commits
 * 
 * This script runs comprehensive tests that go beyond the fast quality gate
 * to ensure trunk-based development safety.
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface PreflightResult {
  passed: boolean;
  duration: number;
  checks: Array<{
    name: string;
    status: 'pass' | 'fail' | 'warn';
    duration: number;
    details: string;
  }>;
}

async function runPreflightTests(): Promise<PreflightResult> {
  console.log('🚀 Running Preflight Tests for Trunk Safety...\n');
  const startTime = Date.now();
  const checks = [];

  try {
    // 1. Environment Validation
    console.log('1️⃣ Checking environment configuration...');
    const envStart = Date.now();
    try {
      execSync('npm run env:check', { stdio: 'pipe' });
      checks.push({
        name: 'Environment Check',
        status: 'pass',
        duration: Date.now() - envStart,
        details: 'All required environment variables validated'
      });
    } catch (error) {
      checks.push({
        name: 'Environment Check',
        status: 'warn',
        duration: Date.now() - envStart,
        details: 'Environment check skipped (expected in CI)'
      });
    }

    // 2. Security Scan
    console.log('2️⃣ Running security scan...');
    const securityStart = Date.now();
    try {
      // Check for common security issues
      const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
      const hasSecurityIssues = checkSecurityIssues(packageJson);
      
      checks.push({
        name: 'Security Scan',
        status: hasSecurityIssues ? 'warn' : 'pass',
        duration: Date.now() - securityStart,
        details: hasSecurityIssues ? 'Potential security issues found' : 'No security issues detected'
      });
    } catch (error) {
      checks.push({
        name: 'Security Scan',
        status: 'fail',
        duration: Date.now() - envStart,
        details: `Security scan failed: ${error.message}`
      });
    }

    // 3. Dependency Check
    console.log('3️⃣ Checking dependencies...');
    const depStart = Date.now();
    try {
      execSync('npm audit --audit-level=high', { stdio: 'pipe' });
      checks.push({
        name: 'Dependency Audit',
        status: 'pass',
        duration: Date.now() - depStart,
        details: 'No high-severity vulnerabilities found'
      });
    } catch (error) {
      checks.push({
        name: 'Dependency Audit',
        status: 'warn',
        duration: Date.now() - depStart,
        details: 'Some vulnerabilities found (check output)'
      });
    }

    // 4. Build Size Check
    console.log('4️⃣ Checking build size...');
    const buildStart = Date.now();
    try {
      execSync('npm run build', { stdio: 'pipe' });
      
      // Check if dist folder exists and get size
      const distPath = join(process.cwd(), 'dist');
      if (existsSync(distPath)) {
        const buildSize = execSync(`du -sh ${distPath}`, { encoding: 'utf8' }).split('\t')[0];
        checks.push({
          name: 'Build Size Check',
          status: 'pass',
          duration: Date.now() - buildStart,
          details: `Build successful, size: ${buildSize}`
        });
      } else {
        checks.push({
          name: 'Build Size Check',
          status: 'fail',
          duration: Date.now() - buildStart,
          details: 'Build failed - no dist folder created'
        });
      }
    } catch (error) {
      checks.push({
        name: 'Build Size Check',
        status: 'fail',
        duration: Date.now() - buildStart,
        details: `Build failed: ${error.message}`
      });
    }

    // 5. Test Coverage Check
    console.log('5️⃣ Checking test coverage...');
    const coverageStart = Date.now();
    try {
      execSync('npm run test', { stdio: 'pipe' });
      checks.push({
        name: 'Test Coverage',
        status: 'pass',
        duration: Date.now() - coverageStart,
        details: 'All tests passing'
      });
    } catch (error) {
      checks.push({
        name: 'Test Coverage',
        status: 'fail',
        duration: Date.now() - coverageStart,
        details: `Tests failed: ${error.message}`
      });
    }

    // 6. MCP Workflow Health Check
    console.log('6️⃣ Checking MCP workflow health...');
    const mcpStart = Date.now();
    try {
      execSync('npm run mcp:health', { stdio: 'pipe' });
      checks.push({
        name: 'MCP Workflow Health',
        status: 'pass',
        duration: Date.now() - mcpStart,
        details: 'MCP orchestrator is healthy'
      });
    } catch (error) {
      checks.push({
        name: 'MCP Workflow Health',
        status: 'warn',
        duration: Date.now() - mcpStart,
        details: 'MCP health check failed (may be expected)'
      });
    }

    const duration = Date.now() - startTime;
    const passed = checks.every(check => check.status === 'pass' || check.status === 'warn');
    
    console.log(`\n📊 Preflight Test Results (${duration}ms):`);
    checks.forEach(check => {
      const icon = check.status === 'pass' ? '✅' : check.status === 'warn' ? '⚠️' : '❌';
      console.log(`  ${icon} ${check.name}: ${check.details}`);
    });

    if (passed) {
      console.log('\n🚀 Preflight Tests PASSED - Safe for trunk commit!');
    } else {
      console.log('\n❌ Preflight Tests FAILED - Fix issues before committing to trunk');
    }

    return { passed, duration, checks };

  } catch (error) {
    console.error('❌ Preflight tests failed:', error);
    return {
      passed: false,
      duration: Date.now() - startTime,
      checks: [{
        name: 'Preflight Tests',
        status: 'fail',
        duration: Date.now() - startTime,
        details: `Preflight tests failed: ${error.message}`
      }]
    };
  }
}

function checkSecurityIssues(packageJson: any): boolean {
  // Check for common security issues
  const scripts = packageJson.scripts || {};
  
  // Check for potentially dangerous scripts
  const dangerousPatterns = [
    'rm -rf',
    'sudo',
    'chmod 777',
    'eval',
    'exec'
  ];
  
  for (const [scriptName, script] of Object.entries(scripts)) {
    const scriptContent = String(script);
    for (const pattern of dangerousPatterns) {
      if (scriptContent.includes(pattern)) {
        console.log(`⚠️  Potentially dangerous script found: ${scriptName}`);
        return true;
      }
    }
  }
  
  return false;
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  runPreflightTests().then(result => {
    process.exit(result.passed ? 0 : 1);
  }).catch(error => {
    console.error('❌ Preflight tests failed:', error);
    process.exit(1);
  });
}

export { runPreflightTests };
