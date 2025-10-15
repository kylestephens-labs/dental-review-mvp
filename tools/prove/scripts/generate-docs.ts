#!/usr/bin/env tsx

/**
 * Lightweight markdown generator for prove documentation
 * Generates check tables from the centralized check registry
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { PROVE_CHECKS, getChecksByCategory, getQuickModeChecks } from '../checks/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '../../..');

interface DocTemplate {
  path: string;
  marker: string;
  content: string;
}

/**
 * Generate check table markdown
 */
function generateCheckTable(checks: Array<{ id: string; name: string; description: string; category: string; quickMode: boolean; toggle?: string }>): string {
  const rows = checks.map(check => {
    const toggle = check.toggle ? ` (${check.toggle})` : '';
    const quickMode = check.quickMode ? '✅' : '❌';
    return `| ${check.name} | \`${check.id}\` | ${check.description}${toggle} | ${quickMode} |`;
  });

  return [
    '| Check | ID | Description | Quick Mode |',
    '| --- | --- | --- | --- |',
    ...rows
  ].join('\n');
}

/**
 * Generate quick mode checks section
 */
function generateQuickModeSection(): string {
  const quickChecks = getQuickModeChecks();
  const criticalQuick = quickChecks.filter(c => c.category === 'critical');
  const parallelQuick = quickChecks.filter(c => c.category === 'parallel');
  const modeSpecificQuick = quickChecks.filter(c => c.category === 'mode-specific');

  return [
    '### Quick Mode Checks',
    '',
    'When using `--quick` flag, only the following checks run:',
    '',
    '#### Critical Checks',
    generateCheckTable(criticalQuick),
    '',
    '#### Parallel Checks',
    generateCheckTable(parallelQuick),
    '',
    '#### Mode-Specific Checks',
    generateCheckTable(modeSpecificQuick),
    ''
  ].join('\n');
}

/**
 * Generate full check catalogue
 */
function generateFullCheckCatalogue(): string {
  const critical = getChecksByCategory('critical');
  const parallel = getChecksByCategory('parallel');
  const modeSpecific = getChecksByCategory('mode-specific');
  const optional = getChecksByCategory('optional');

  return [
    '### Check Catalogue',
    '',
    '#### Critical Checks (Serial, Fail-Fast)',
    generateCheckTable(critical),
    '',
    '#### Parallel Checks (Concurrent)',
    generateCheckTable(parallel),
    '',
    '#### Mode-Specific Checks',
    generateCheckTable(modeSpecific),
    '',
    '#### Optional Checks (Toggle-Controlled)',
    generateCheckTable(optional),
    ''
  ].join('\n');
}

/**
 * Update a markdown file with generated content
 */
function updateMarkdownFile(filePath: string, marker: string, newContent: string): void {
  if (!existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }

  const content = readFileSync(filePath, 'utf-8');
  const markerStart = `<!-- @generated-start:${marker} -->`;
  const markerEnd = `<!-- @generated-end:${marker} -->`;

  const startIndex = content.indexOf(markerStart);
  const endIndex = content.indexOf(markerEnd);

  if (startIndex === -1 || endIndex === -1) {
    console.error(`Markers not found in ${filePath}: ${markerStart} and ${markerEnd}`);
    return;
  }

  const before = content.substring(0, startIndex + markerStart.length);
  const after = content.substring(endIndex);
  const updated = before + '\n' + newContent + '\n' + after;

  writeFileSync(filePath, updated, 'utf-8');
  console.log(`Updated ${filePath} with ${marker} content`);
}

/**
 * Main generation function
 */
function generateDocs(): void {
  console.log('Generating prove documentation...');

  // Generate quick mode section
  const quickModeContent = generateQuickModeSection();
  
  // Generate full check catalogue
  const fullCatalogueContent = generateFullCheckCatalogue();

  // Update architecture.md
  updateMarkdownFile(
    join(projectRoot, 'docs/dentist_project/architecture.md'),
    'prove-checks-table',
    fullCatalogueContent
  );

  // Update prove-overview.md
  updateMarkdownFile(
    join(projectRoot, 'docs/misc/prove_enforcement_8_paths/prove-overview.md'),
    'check-catalogue',
    fullCatalogueContent
  );

  updateMarkdownFile(
    join(projectRoot, 'docs/misc/prove_enforcement_8_paths/prove-overview.md'),
    'quick-mode-checks',
    quickModeContent
  );

  console.log('Documentation generation complete!');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateDocs();
}
