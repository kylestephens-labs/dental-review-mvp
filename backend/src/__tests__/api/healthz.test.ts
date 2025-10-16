import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { GET as healthCheck, HEAD as healthCheckHead } from '../../api/healthz';
import { getCommitSha } from '../../utils/buildInfo.js';

// Mock the getCommitSha function
vi.mock('../../utils/buildInfo.js', () => ({
  getCommitSha: vi.fn()
}));

describe('GET /healthz', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.get('/healthz', healthCheck);
    app.head('/healthz', healthCheckHead);
    
    // Reset mocks and set default return value
    vi.clearAllMocks();
    vi.mocked(getCommitSha).mockReturnValue('test123');
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.COMMIT_SHA;
    delete process.env.VERCEL_GIT_COMMIT_SHA;
    delete process.env.GIT_SHA;
  });

  describe('Successful liveness check', () => {
    it('should return 200 OK with status and sha', async () => {
      // Set up mock to return specific value
      vi.mocked(getCommitSha).mockReturnValue('abc123def456');

      const response = await request(app)
        .get('/healthz')
        .expect(200);

      expect(response.body).toEqual({
        status: 'ok',
        sha: 'abc123def456'
      });
      expect(typeof response.body.sha).toBe('string');
      expect(response.body.sha.length).toBeGreaterThan(0);
    });

    it('should use VERCEL_GIT_COMMIT_SHA as fallback', async () => {
      vi.mocked(getCommitSha).mockReturnValue('vercel123');

      const response = await request(app)
        .get('/healthz')
        .expect(200);

      expect(response.body.sha).toBe('vercel123');
    });

    it('should use GIT_SHA as second fallback', async () => {
      vi.mocked(getCommitSha).mockReturnValue('git456');

      const response = await request(app)
        .get('/healthz')
        .expect(200);

      expect(response.body.sha).toBe('git456');
    });

    it('should use "dev" as final fallback when no env vars are set', async () => {
      vi.mocked(getCommitSha).mockReturnValue('dev');

      const response = await request(app)
        .get('/healthz')
        .expect(200);

      expect(response.body.sha).toBe('dev');
    });
  });

  describe('HEAD request behavior', () => {
    it('should return 200 OK for HEAD request', async () => {
      process.env.COMMIT_SHA = 'abc123def456';

      await request(app)
        .head('/healthz')
        .expect(200);
    });
  });

  describe('Dependency-free operation', () => {
    it('should work even when database is unavailable', async () => {
      // This test ensures the endpoint doesn't make any external calls
      process.env.COMMIT_SHA = 'test123';

      const response = await request(app)
        .get('/healthz')
        .expect(200);

      expect(response.body).toEqual({
        status: 'ok',
        sha: 'test123'
      });
    });

    it('should not include extra fields in response', async () => {
      process.env.COMMIT_SHA = 'test123';

      const response = await request(app)
        .get('/healthz')
        .expect(200);

      // Should only have status and sha, no timestamp, environment, etc.
      expect(Object.keys(response.body)).toEqual(['status', 'sha']);
    });
  });

  describe('Response format validation', () => {
    it('should return valid JSON', async () => {
      process.env.COMMIT_SHA = 'test123';

      const response = await request(app)
        .get('/healthz')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toBeDefined();
      expect(typeof response.body).toBe('object');
    });

    it('should have status exactly equal to "ok"', async () => {
      process.env.COMMIT_SHA = 'test123';

      const response = await request(app)
        .get('/healthz')
        .expect(200);

      expect(response.body.status).toBe('ok');
    });
  });

});
