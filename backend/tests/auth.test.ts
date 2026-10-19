import request from 'supertest';
import { createApp } from '../src/app';

describe('Auth Validation & Security Endpoints', () => {
  const app = createApp();

  it('POST /api/v1/auth/register fails with invalid payload (missing fields)', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'not-an-email',
      password: '123',
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Validation failed');
    expect(res.body.details).toBeInstanceOf(Array);
  });

  it('POST /api/v1/auth/login fails when credentials are missing', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/v1/auth/me rejects request without bearer token with 401', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Authentication token required.');
  });

  it('GET /api/v1/auth/me rejects invalid bearer token with 403', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer invalid-token-payload');
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});
