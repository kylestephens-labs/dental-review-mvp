// Entry point for prove CLI

import { logger } from './logger.js';
import { buildContext, getContextSummary, validateContext } from './context.js';
import { runAll } from './runner.js';
import { parseArgs, printHelp } from './utils/args.js';

// Parse command line arguments
const args = process.argv.slice(2);
const options = parseArgs(args);

// Handle help option
if (options.help) {
  printHelp();
  process.exit(0);
}

// Set up logging based on options
if (options.json) {
  process.env.PROVE_JSON = '1';
}

if (options.quickMode) {
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

  // Run all prove checks
  logger.info("Testing runner...");
  const checkResults = await runAll(context, { 
    quickMode: options.quickMode,
    failFast: true 
  });
  
  // Generate final report
  logger.generateReport(context.mode, checkResults);

  // Check for failures and provide clear failure reasons
  const failedChecks = checkResults.filter(result => !result.ok);
  
  if (failedChecks.length > 0) {
    logger.error("Prove checks failed", {
      totalChecks: checkResults.length,
      passedChecks: checkResults.filter(r => r.ok).length,
      failedChecks: failedChecks.length,
      failures: failedChecks.map(check => ({
        id: check.id,
        reason: check.reason,
        duration: `${check.ms}ms`
      }))
    });
    
    // Print detailed failure information
    logger.error("Failed checks details:");
    failedChecks.forEach(check => {
      logger.error(`[${check.id}] Failed: ${check.reason || 'Unknown error'}`);
      if (check.details) {
        logger.error(`[${check.id}] Details:`, check.details);
      }
    });
    
    process.exit(1);
  }

  // All checks passed
  logger.success("All prove checks passed successfully");
  process.exit(0);

} catch (error) {
  logger.error("Prove execution failed", {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined
  });
  
  // Print clear error message
  logger.error("Fatal error occurred during prove execution");
  if (error instanceof Error) {
    logger.error(`Error: ${error.message}`);
    if (error.stack) {
      logger.error("Stack trace:", error.stack);
    }
  } else {
    logger.error(`Error: ${String(error)}`);
  }
  
  process.exit(1);
}
