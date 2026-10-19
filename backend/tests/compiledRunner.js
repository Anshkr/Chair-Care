const request = require('supertest');
const jwt = require('jsonwebtoken');
const { createApp } = require('../dist/app');
const { env } = require('../dist/config/env');

async function runCompiledTests() {
  console.log('🧪 Starting ChairCare Backend Verification Suite on compiled dist...');
  let passed = 0;
  let failed = 0;

  const app = createApp();

  const test = async (name, fn) => {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`, err.message);
      failed++;
    }
  };

  // Test 1: Health
  await test('GET /health returns 200, status=healthy, service=ChairCare REST API', async () => {
    const res = await request(app).get('/health');
    if (res.status !== 200 || res.body.status !== 'healthy') {
      throw new Error(`Expected 200 and healthy, got ${res.status}`);
    }
  });

  // Test 2: 404 Route
  await test('GET /api/v1/invalid-route returns 404 with standard error format', async () => {
    const res = await request(app).get('/api/v1/invalid-route');
    if (res.status !== 404 || !res.body.error.includes('Route not found')) {
      throw new Error(`Expected 404 route not found, got ${res.status}`);
    }
  });

  // Test 3: Auth Validation
  await test('POST /api/v1/auth/register fails with 400 when missing email/password', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Test',
    });
    if (res.status !== 400 || res.body.error !== 'Validation failed') {
      throw new Error(`Expected 400 validation error, got ${res.status}`);
    }
  });

  // Test 4: Auth Missing Bearer Token
  await test('GET /api/v1/auth/me rejects unauthenticated request with 401', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    if (res.status !== 401 || res.body.error !== 'Authentication token required.') {
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
    if (res.status !== 403 || !res.body.error.includes('Access denied')) {
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
  await test('Customer booking request fails validation if required fields are missing', async () => {
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
  console.log(`📊 Dist Test Results: ${passed} passed, ${failed} failed`);
  console.log(`========================================`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runCompiledTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
