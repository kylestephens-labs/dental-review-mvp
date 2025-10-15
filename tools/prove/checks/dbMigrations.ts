// Database migrations validation check
// Tests migration up/down using Testcontainers Postgres

import type { ProveContext } from '../context.js';
import { withPostgresContainer, getMigrationFiles, testAllMigrations } from './dbMigrationsUtils.js';

export async function checkDbMigrations(context: ProveContext): Promise<{ ok: boolean; reason?: string; details?: string }> {
  const { cfg, log } = context;

  // Skip if DB migrations toggle is disabled
  if (!cfg.toggles.dbMigrations) {
    log.info('DB migrations check skipped (toggle disabled)');
    return { ok: true, reason: 'DB migrations check disabled' };
  }

  log.info('Running database migrations validation...');

  try {
    // Get migration files
    const migrationFiles = getMigrationFiles();
    if (migrationFiles.length === 0) {
      log.warn('No migration files found');
      return { ok: true, reason: 'No migration files found' };
    }

    log.info(`Found ${migrationFiles.length} migration files`);
    
    // Log migration order for debugging
    migrationFiles.forEach((file, index) => {
      log.info(`Migration ${index + 1}: ${file}`);
    });

    // Test all migrations using container helper
    const result = await withPostgresContainer(
      async (containerContext) => {
        return await testAllMigrations(containerContext.client, migrationFiles, log);
      },
      undefined, // Use default config
      log
    );

    if (!result.ok) {
      return result;
    }

    log.info('All migrations validated successfully');
    return { ok: true, reason: 'All migrations validated successfully' };

  } catch (error) {
    log.error('DB migrations check failed', { error: error instanceof Error ? error.message : String(error) });
    return {
      ok: false,
      reason: 'DB migrations check failed',
      details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

