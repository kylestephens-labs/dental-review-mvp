/**
 * Database migrations utilities for container management and SQL parsing
 */

import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { Client } from 'pg';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

export interface ContainerConfig {
  database: string;
  username: string;
  password: string;
  image: string;
}

export interface MigrationResult {
  ok: boolean;
  reason?: string;
  details?: string;
}

export interface ContainerContext {
  container: StartedPostgreSqlContainer;
  client: Client;
  connectionString: string;
}

const DEFAULT_CONFIG: ContainerConfig = {
  database: 'test_db',
  username: 'test_user',
  password: 'test_password',
  image: 'postgres:15'
};

/**
 * Start a PostgreSQL container with the given configuration
 */
export async function startPostgresContainer(
  config: ContainerConfig = DEFAULT_CONFIG,
  log: any
): Promise<ContainerContext> {
  log.info('Starting PostgreSQL test container...');
  
  const container = await new PostgreSqlContainer(config.image)
    .withDatabase(config.database)
    .withUsername(config.username)
    .withPassword(config.password)
    .start();

  const connectionString = container.getConnectionUri();
  log.info('PostgreSQL container started', { 
    connectionString: connectionString.replace(/:[^:]*@/, ':***@') 
  });

  const client = new Client({ connectionString });
  await client.connect();
  log.info('Connected to test database');

  return { container, client, connectionString };
}

/**
 * Stop a PostgreSQL container and close the client connection
 */
export async function stopPostgresContainer(
  context: ContainerContext,
  log: any
): Promise<void> {
  const { container, client } = context;

  // Close database client
  if (client) {
    try {
      await client.end();
      log.info('Database client closed');
    } catch (error) {
      log.warn('Failed to close database client', { 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  // Stop container
  if (container) {
    try {
      await container.stop();
      log.info('PostgreSQL container stopped');
    } catch (error) {
      log.warn('Failed to stop container', { 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }
}

/**
 * Execute a function with a PostgreSQL container, ensuring cleanup
 */
export async function withPostgresContainer<T>(
  fn: (context: ContainerContext) => Promise<T>,
  config: ContainerConfig = DEFAULT_CONFIG,
  log: any
): Promise<T> {
  let context: ContainerContext | null = null;
  
  try {
    context = await startPostgresContainer(config, log);
    return await fn(context);
  } finally {
    if (context) {
      await stopPostgresContainer(context, log);
    }
  }
}

/**
 * Get migration files from the configured directories
 */
export function getMigrationFiles(): string[] {
  // Only test RDS migrations - business logic should be in AWS RDS, not Supabase
  const migrationDirs = [
    'scripts/migrations'  // RDS migrations only
  ];

  const migrationFiles: string[] = [];

  for (const dir of migrationDirs) {
    try {
      const files = readdirSync(dir)
        .filter(file => file.endsWith('.sql'))
        .sort((a, b) => {
          // Sort by filename to ensure proper migration order
          // RDS migrations use simple numeric prefixes (001, 002, etc.)
          return a.localeCompare(b);
        })
        .map(file => join(dir, file));
      migrationFiles.push(...files);
    } catch (error) {
      // Directory doesn't exist, skip
    }
  }

  return migrationFiles;
}

/**
 * Parse SQL statements using a more robust approach
 * This is a simplified version that handles basic cases
 */
export function parseSqlStatements(content: string): string[] {
  const statements: string[] = [];
  const lines = content.split('\n');
  let currentStatement = '';
  let inComment = false;
  let inString = false;
  let stringChar = '';

  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Skip empty lines and comments
    if (!trimmedLine || trimmedLine.startsWith('--')) {
      continue;
    }

    // Handle block comments
    if (trimmedLine.includes('/*')) {
      inComment = true;
    }
    if (inComment) {
      if (trimmedLine.includes('*/')) {
        inComment = false;
      }
      continue;
    }

    // Handle strings
    let i = 0;
    while (i < line.length) {
      const char = line[i];
      
      if (!inString && (char === "'" || char === '"')) {
        inString = true;
        stringChar = char;
      } else if (inString && char === stringChar) {
        inString = false;
      }
      
      currentStatement += char;
      i++;
    }

    // Check for statement end
    if (!inString && trimmedLine.endsWith(';')) {
      const statement = currentStatement.trim();
      if (statement && !statement.startsWith('--')) {
        statements.push(statement);
      }
      currentStatement = '';
    } else {
      currentStatement += '\n';
    }
  }

  // Add final statement if it doesn't end with semicolon
  const finalStatement = currentStatement.trim();
  if (finalStatement && !finalStatement.startsWith('--')) {
    statements.push(finalStatement);
  }

  return statements;
}

/**
 * Execute a migration file
 */
export async function executeMigration(
  client: Client,
  migrationFile: string,
  log: any
): Promise<MigrationResult> {
  try {
    log.info(`Executing migration: ${migrationFile}`);
    
    const migrationContent = readFileSync(migrationFile, 'utf8');
    const statements = parseSqlStatements(migrationContent);

    log.info(`Found ${statements.length} statements in migration: ${migrationFile}`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          log.info(`Executing statement ${i + 1}/${statements.length}: ${statement.substring(0, 50)}...`);
          await client.query(statement);
          log.info(`Statement ${i + 1} executed successfully`);
        } catch (error) {
          log.error(`Failed to execute statement ${i + 1}: ${statement.substring(0, 100)}...`);
          return {
            ok: false,
            reason: `Failed to execute statement ${i + 1} in migration: ${migrationFile}`,
            details: `Statement: ${statement.substring(0, 200)}...\nError: ${error instanceof Error ? error.message : 'Unknown error'}`
          };
        }
      }
    }

    log.info(`Migration executed successfully: ${migrationFile}`);
    return { ok: true, reason: `Migration executed successfully: ${migrationFile}` };

  } catch (error) {
    return {
      ok: false,
      reason: `Failed to execute migration: ${migrationFile}`,
      details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Test all migrations in sequence
 */
export async function testAllMigrations(
  client: Client,
  migrationFiles: string[],
  log: any
): Promise<MigrationResult> {
  try {
    log.info('Testing all migrations in sequence...');

    // Run all migrations in order
    for (const migrationFile of migrationFiles) {
      const result = await executeMigration(client, migrationFile, log);
      if (!result.ok) {
        return result;
      }
    }

    log.info('All migrations executed successfully');
    return { ok: true, reason: 'All migrations executed successfully' };

  } catch (error) {
    return {
      ok: false,
      reason: 'Migration execution failed',
      details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}
