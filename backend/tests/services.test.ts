import request from 'supertest';
import { createApp } from '../src/app';

describe('Service Catalogue API', () => {
  const app = createApp();

  it('GET /api/v1/services returns list of active services', async () => {
    const res = await request(app).get('/api/v1/services');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0]).toHaveProperty('code', 'HYDRAULIC_REPLACE');
    expect(res.body.data[0]).toHaveProperty('estimatedPrice', 1299);
  });
});
