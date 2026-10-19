import request from 'supertest';
import { createApp } from '../src/app';

describe('Health & Root Routes', () => {
  const app = createApp();

  it('GET /health returns 200 and healthy status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'healthy');
    expect(res.body).toHaveProperty('service', 'ChairCare REST API');
  });

  it('GET /non-existent-route returns 404 with error message', async () => {
    const res = await request(app).get('/api/v1/invalid-route');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Route not found');
  });
});
