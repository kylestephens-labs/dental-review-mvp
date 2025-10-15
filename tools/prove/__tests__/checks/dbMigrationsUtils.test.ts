import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  parseSqlStatements,
  getMigrationFiles,
  type ContainerConfig,
  type MigrationResult
} from '../../checks/dbMigrationsUtils.js';
import { readdirSync } from 'fs';

// Mock fs functions
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();
  return {
    ...actual,
    readFileSync: vi.fn(),
    readdirSync: vi.fn()
  };
});

describe('dbMigrationsUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('parseSqlStatements', () => {
    it('should parse simple SQL statements', () => {
      const sql = `
        CREATE TABLE users (id SERIAL PRIMARY KEY, name VARCHAR(255));
        INSERT INTO users (name) VALUES ('John');
        SELECT * FROM users;
      `;

      const statements = parseSqlStatements(sql);
      
      expect(statements).toHaveLength(3);
      expect(statements[0]).toContain('CREATE TABLE users');
      expect(statements[1]).toContain('INSERT INTO users');
      expect(statements[2]).toContain('SELECT * FROM users');
    });

    it('should handle comments correctly', () => {
      const sql = `
        -- This is a comment
        CREATE TABLE users (id SERIAL PRIMARY KEY);
        /* Multi-line comment */
        INSERT INTO users (id) VALUES (1);
      `;

      const statements = parseSqlStatements(sql);
      
      expect(statements).toHaveLength(2);
      expect(statements[0]).toContain('CREATE TABLE users');
      expect(statements[1]).toContain('INSERT INTO users');
    });

    it('should handle strings correctly', () => {
      const sql = `
        CREATE TABLE users (name VARCHAR(255) DEFAULT 'John Doe');
        INSERT INTO users (name) VALUES ('Jane "Smith"');
        SELECT * FROM users WHERE name = 'test';
      `;

      const statements = parseSqlStatements(sql);
      
      expect(statements).toHaveLength(3);
      expect(statements[0]).toContain("DEFAULT 'John Doe'");
      expect(statements[1]).toContain('Jane "Smith"');
      expect(statements[2]).toContain("name = 'test'");
    });

    it('should handle multi-line statements', () => {
      const sql = `
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE
        );
        INSERT INTO users (name, email) 
        VALUES ('John', 'john@example.com');
      `;

      const statements = parseSqlStatements(sql);
      
      expect(statements).toHaveLength(2);
      expect(statements[0]).toContain('CREATE TABLE users');
      expect(statements[0]).toContain('id SERIAL PRIMARY KEY');
      expect(statements[0]).toContain('email VARCHAR(255) UNIQUE');
      expect(statements[1]).toContain('INSERT INTO users');
    });

    it('should handle empty statements', () => {
      const sql = `
        CREATE TABLE users (id SERIAL PRIMARY KEY);
        
        ;
        
        INSERT INTO users (id) VALUES (1);
      `;

      const statements = parseSqlStatements(sql);
      
      expect(statements).toHaveLength(3);
      expect(statements[0]).toContain('CREATE TABLE users');
      expect(statements[1]).toBe(';');
      expect(statements[2]).toContain('INSERT INTO users');
    });

    it('should handle statements without semicolons', () => {
      const sql = `
        CREATE TABLE users (id SERIAL PRIMARY KEY)
        INSERT INTO users (id) VALUES (1)
      `;

      const statements = parseSqlStatements(sql);
      
      expect(statements).toHaveLength(1);
      expect(statements[0]).toContain('CREATE TABLE users');
      expect(statements[0]).toContain('INSERT INTO users');
    });
  });

  describe('getMigrationFiles', () => {
    it('should return actual migration files from scripts/migrations directory', () => {
      const files = getMigrationFiles();
      
      expect(files.length).toBeGreaterThan(0);
      expect(files[0]).toBe('scripts/migrations/001_init.sql');
      expect(files[1]).toBe('scripts/migrations/002_queue_templates_reviews.sql');
    });

    it('should filter only .sql files', () => {
      const files = getMigrationFiles();
      
      files.forEach(file => {
        expect(file).toMatch(/\.sql$/);
      });
    });

    it('should sort files alphabetically', () => {
      const files = getMigrationFiles();
      
      expect(files[0]).toBe('scripts/migrations/001_init.sql');
      expect(files[1]).toBe('scripts/migrations/002_queue_templates_reviews.sql');
    });
  });
});
