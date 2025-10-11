import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../index';

describe('Health Endpoints', () => {
  it('should return health status', async () => {
    const response = await request(app).get('/health');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('uptime');
    expect(response.body).toHaveProperty('memory');
  });

  it('should return ready status', async () => {
    const response = await request(app).get('/health/ready');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ready');
  });

  it('should return live status', async () => {
    const response = await request(app).get('/health/live');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'alive');
  });
});
