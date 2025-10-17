// Simple argument parsing utility for prove CLI
// Keeps argument parsing logic separate and testable

export interface CLIOptions {
  quickMode: boolean;
  verbose: boolean;
  json: boolean;
  help: boolean;
  tdd: boolean;
}

/**
 * Parse command line arguments
 * @param args - Array of command line arguments
 * @returns Parsed CLI options
 */
export function parseArgs(args: string[]): CLIOptions {
  const options: CLIOptions = {
    quickMode: false,
    verbose: false,
    json: false,
    help: false,
    tdd: false,
  };

  for (const arg of args) {
    switch (arg) {
      case '--quick':
        options.quickMode = true;
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--json':
        options.json = true;
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
      case '--tdd':
        options.tdd = true;
        break;
    }
  }

  return options;
}

/**
 * Print help information
 */
export function printHelp(): void {
  console.log(`
Prove Quality Gates - CLI

Usage: npm run prove [options]

Options:
  --quick, -q     Run in quick mode (env + typecheck + lint + tests only)
  --verbose, -v   Enable verbose logging
  --json          Output results in JSON format
  --help, -h      Show this help message

Examples:
  npm run prove              # Run all quality gates
  npm run prove:quick        # Run quick mode
  npm run prove -- --json    # Run with JSON output
  npm run prove -- --verbose # Run with verbose logging
`);
}
