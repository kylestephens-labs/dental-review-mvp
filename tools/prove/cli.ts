// Entry point for prove CLI
// TODO: Implement CLI logic

import { logger } from './logger.js';
import { buildContext, getContextSummary, validateContext } from './context.js';
import { runAll } from './runner.js';

// Parse command line arguments
const args = process.argv.slice(2);
const isQuickMode = args.includes('--quick');
const unusedVariable = 'this will cause a lint error';
const anotherUnused = 'this will also cause a lint error';

if (isQuickMode) {
  logger.header("Prove Quality Gates - Quick Mode");
  logger.info("Running fast checks: env + typecheck + lint + unit tests");
} else {
  logger.header("Prove Quality Gates - Full Mode");
  logger.info("Running all quality gates");
}

try {
  // Build and test context
  const context = await buildContext();
  
  // Validate context
  const isValid = validateContext(context);
  if (!isValid) {
    logger.error("Context validation failed");
    process.exit(1);
  }

  // Print context summary
  const summary = getContextSummary(context);
  logger.success(`Context summary: ${summary}`);

  // Test context access
  logger.info("Context details:", {
    mode: context.mode,
    currentBranch: context.git.currentBranch,
    isMainBranch: context.git.isMainBranch,
    changedFilesCount: context.git.changedFiles.length,
    hasUncommittedChanges: context.git.hasUncommittedChanges,
    isCI: context.isCI,
    concurrency: context.cfg.runner.concurrency,
    thresholds: context.cfg.thresholds,
  });

  // Context is ready for checks to import
  logger.success("Context system ready for checks to import");

  // Test runner
  logger.info("Testing runner...");
  const checkResults = await runAll(context, { quickMode: isQuickMode });
  
  // Generate final report
  logger.generateReport(context.mode, checkResults);

} catch (error) {
  logger.error("Prove execution failed", { 
    error: error instanceof Error ? error.message : String(error) 
  });
  process.exit(1);
}
