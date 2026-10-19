import { createApp } from '../src/app';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env';

// Simple lightweight test runner to run all tests without spawning heavyweight child processes
async function runAll() {
  console.log('🧪 Starting ChairCare Backend Test Suite...');
  let passed = 0;
  let failed = 0;

  const app = createApp();

  const test = async (name: string, fn: () => Promise<void>) => {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ❌ FAIL: ${name}`, err.message);
      failed++;
    }
  };

  // Test 1: Health
  await test('GET /health returns 200 and healthy status', async () => {
    const res = await request(app).get('/health');
    if (res.status !== 200 || res.body.status !== 'healthy') {
      throw new Error(`Expected 200 and healthy, got ${res.status} ${JSON.stringify(res.body)}`);
    }
  });

  // Test 2: 404 Route
  await test('GET /api/v1/invalid-route returns 404', async () => {
    const res = await request(app).get('/api/v1/invalid-route');
    if (res.status !== 404) {
      throw new Error(`Expected 404, got ${res.status}`);
    }
  });

  // Test 3: Auth Validation
  await test('POST /api/v1/auth/register fails with invalid payload', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'not-an-email',
      password: '123',
    });
    if (res.status !== 400 || res.body.error !== 'Validation failed') {
      throw new Error(`Expected 400 validation failure, got ${res.status}`);
    }
  });

  // Test 4: Auth Missing Bearer Token
  await test('GET /api/v1/auth/me rejects unauthenticated request with 401', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    if (res.status !== 401) {
      throw new Error(`Expected 401, got ${res.status}`);
    }
  });

  // Test 5: Role Guard Customer on Admin Endpoint
  await test('Customer is forbidden from accessing Admin Dashboard (403)', async () => {
    const customerToken = jwt.sign(
      { userId: '00000000-0000-0000-0000-000000000001', email: 'c@test.com', role: 'customer' },
      env.JWT_SECRET
    );
    const res = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${customerToken}`);
    if (res.status !== 403) {
      throw new Error(`Expected 403 forbidden, got ${res.status}`);
    }
  });

  // Test 6: Role Guard Technician on Admin Endpoint
  await test('Technician is forbidden from accessing Admin Dashboard (403)', async () => {
    const techToken = jwt.sign(
      { userId: '00000000-0000-0000-0000-000000000002', email: 't@test.com', role: 'technician' },
      env.JWT_SECRET
    );
    const res = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${techToken}`);
    if (res.status !== 403) {
      throw new Error(`Expected 403 forbidden, got ${res.status}`);
    }
  });

  // Test 7: Customer Request Validation
  await test('Customer booking request fails validation if fields are missing', async () => {
    const customerToken = jwt.sign(
      { userId: '00000000-0000-0000-0000-000000000001', email: 'c@test.com', role: 'customer' },
      env.JWT_SECRET
    );
    const res = await request(app)
      .post('/api/v1/customer/requests')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ chairModel: '' });
    if (res.status !== 400) {
      throw new Error(`Expected 400 validation error, got ${res.status}`);
    }
  });

  console.log(`\n========================================`);
  console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
  console.log(`========================================`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAll().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
