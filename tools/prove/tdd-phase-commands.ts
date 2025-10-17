#!/usr/bin/env node

import { 
  writeTddPhase, 
  readTddPhase, 
  getTddPhaseMessage, 
  formatTddPhaseDisplay,
  type TddPhase,
  type TddPhaseData
} from './utils/tdd-phase.js';

/**
 * Handle TDD phase write commands
 */
function handlePhaseWrite(phase: TddPhase): void {
  try {
    const phaseData = writeTddPhase(phase);
    console.log(`✅ ${getTddPhaseMessage(phase)}`);
    console.log(`📁 Phase data written to: ${phaseData.phase}`);
  } catch (error) {
    console.error(`❌ Failed to write ${phase} phase:`, error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

/**
 * Handle TDD phase status command
 */
function handleStatus(): void {
  const currentPhase = readTddPhase();
  if (currentPhase) {
    console.log(formatTddPhaseDisplay(currentPhase));
  } else {
    console.log('No TDD phase currently set');
  }
}

/**
 * Show help information
 */
function showHelp(): void {
  console.log('Usage: tdd-phase-commands <red|green|refactor|status>');
  console.log('');
  console.log('Commands:');
  console.log('  red       - Mark current work as Red phase (write failing tests)');
  console.log('  green     - Mark current work as Green phase (make tests pass)');
  console.log('  refactor  - Mark current work as Refactor phase (improve code)');
  console.log('  status    - Show current TDD phase');
}

/**
 * Main function to handle TDD phase commands
 */
function main(): void {
  const command = process.argv[2];
  
  switch (command) {
    case 'red':
      handlePhaseWrite('red');
      break;
    case 'green':
      handlePhaseWrite('green');
      break;
    case 'refactor':
      handlePhaseWrite('refactor');
      break;
    case 'status':
      handleStatus();
      break;
    default:
      showHelp();
      process.exit(1);
  }
}

// Check if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

// Re-export for backward compatibility
export { writeTddPhase, readTddPhase } from './utils/tdd-phase.js';
