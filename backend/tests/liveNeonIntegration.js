const request = require('supertest');
const { createApp } = require('../dist/app');
const { query } = require('../dist/config/database');

async function runLiveNeonIntegrationTests() {
  console.log('🌐 Starting Live Neon PostgreSQL Integration Test Suite...');
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

  // Test 1: Direct Neon query test
  await test('Direct PostgreSQL / Neon connection query test (SELECT NOW())', async () => {
    const res = await query('SELECT NOW() as current_time, current_database() as db_name;');
    if (res.rows.length === 0 || !res.rows[0].db_name) {
      throw new Error('Database query failed to return rows.');
    }
    console.log(`     Connected to DB: ${res.rows[0].db_name} at ${res.rows[0].current_time}`);
  });

  // Test 2: Health Endpoint reporting connected database
  await test('GET /api/health reports healthy API and connected Neon database', async () => {
    const res = await request(app).get('/api/health');
    if (res.status !== 200 || res.body.status !== 'healthy') {
      throw new Error(`Expected status 200 healthy, got ${res.status}`);
    }
    if (res.body.database?.status !== 'connected') {
      throw new Error(`Expected database.status = 'connected', got ${JSON.stringify(res.body.database)}`);
    }
    console.log(`     Health report latency: ${res.body.database.latencyMs}ms, driver: ${res.body.database.driver}`);
  });

  // Test 3: Fetch services from Neon
  await test('GET /api/v1/services retrieves real seeded services from Neon', async () => {
    const res = await request(app).get('/api/v1/services');
    if (res.status !== 200 || !Array.isArray(res.body.data) || res.body.data.length === 0) {
      throw new Error(`Expected list of services, got ${JSON.stringify(res.body)}`);
    }
    console.log(`     Retrieved ${res.body.data.length} services from Neon (e.g. ${res.body.data[0].title})`);
  });

  // Test 4: Live Customer Login against Neon bcrypt hash
  let customerToken = '';
  await test('POST /api/v1/auth/login authenticates customer against Neon database', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'customer@chaircare.com',
      password: 'Password@123',
    });
    if (res.status !== 200 || !res.body.data?.token) {
      throw new Error(`Login failed: ${JSON.stringify(res.body)}`);
    }
    customerToken = res.body.data.token;
    if (res.body.data.user.role !== 'customer') {
      throw new Error(`Expected role customer, got ${res.body.data.user.role}`);
    }
    console.log(`     Logged in customer: ${res.body.data.user.name} (${res.body.data.user.email})`);
  });

  // Test 5: Live Customer Registration with unique email
  const testEmail = `newcustomer_${Date.now()}@test.com`;
  let registeredToken = '';
  await test('POST /api/v1/auth/register creates new customer in Neon database', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Vikas Malhotra',
      email: testEmail,
      phone: `+91 ${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      password: 'SecurePassword123',
      defaultAddress: 'Tower 2, Apt 401, DLF Phase 5, Gurgaon',
    });

    if (res.status !== 201 || !res.body.data?.token) {
      throw new Error(`Registration failed: ${JSON.stringify(res.body)}`);
    }
    registeredToken = res.body.data.token;
    if (res.body.data.user.role !== 'customer') {
      throw new Error(`Expected customer role, got ${res.body.data.user.role}`);
    }
    console.log(`     Successfully created new customer in Neon: ${res.body.data.user.name} (${res.body.data.user.email})`);
  });

  // Test 6: Duplicate Registration Rejection (409 Conflict)
  await test('POST /api/v1/auth/register rejects duplicate email registration with 409 Conflict', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Duplicate Attempt',
      email: testEmail,
      phone: '+91 99999 88888',
      password: 'AnotherPassword123',
    });

    if (res.status !== 409 || !res.body.error.includes('already exists')) {
      throw new Error(`Expected 409 conflict, got ${res.status} ${JSON.stringify(res.body)}`);
    }
    console.log(`     Duplicate email successfully rejected with 409: ${res.body.error}`);
  });

  // Test 7: Newly registered customer can fetch profile with their JWT token
  await test('GET /api/v1/auth/me retrieves new customer profile from Neon', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${registeredToken}`);
    if (res.status !== 200 || !res.body.data?.user) {
      throw new Error(`Profile fetch failed: ${JSON.stringify(res.body)}`);
    }
    console.log(`     Fetched profile for ${res.body.data.user.name}, loyalty points: ${res.body.data.profile?.loyalty_points}`);
  });

  // Test 8: Live Admin Login and Dashboard Metrics from Neon
  await test('POST /api/v1/auth/login and GET /api/v1/admin/dashboard calculates live Neon metrics', async () => {
    const loginRes = await request(app).post('/api/v1/auth/login').send({
      email: 'admin@chaircare.com',
      password: 'Password@123',
    });
    if (loginRes.status !== 200 || !loginRes.body.data?.token) {
      throw new Error(`Admin login failed: ${JSON.stringify(loginRes.body)}`);
    }
    const adminToken = loginRes.body.data.token;

    const dashRes = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);
    if (dashRes.status !== 200 || !dashRes.body.data?.metrics) {
      throw new Error(`Admin dashboard fetch failed: ${JSON.stringify(dashRes.body)}`);
    }
    console.log(`     Live Dashboard Metrics: Active Requests=${dashRes.body.data.metrics.activeRequests}, Verified Techs=${dashRes.body.data.metrics.verifiedTechnicians}, Revenue=₹${dashRes.body.data.metrics.totalRevenue}`);

    // Test 9: Admin Customers live fetch
    const custRes = await request(app)
      .get('/api/v1/admin/customers')
      .set('Authorization', `Bearer ${adminToken}`);
    if (custRes.status !== 200 || !Array.isArray(custRes.body.data)) {
      throw new Error(`Admin customers fetch failed: ${JSON.stringify(custRes.body)}`);
    }
    console.log(`     Admin Customers count: ${custRes.body.data.length}`);

    // Test 10: Admin Reviews live fetch
    const revRes = await request(app)
      .get('/api/v1/admin/reviews')
      .set('Authorization', `Bearer ${adminToken}`);
    if (revRes.status !== 200 || !Array.isArray(revRes.body.data)) {
      throw new Error(`Admin reviews fetch failed: ${JSON.stringify(revRes.body)}`);
    }
    console.log(`     Admin Reviews count: ${revRes.body.data.length}`);

    // Test 11: Admin Users live fetch
    const adminUsersRes = await request(app)
      .get('/api/v1/admin/admins')
      .set('Authorization', `Bearer ${adminToken}`);
    if (adminUsersRes.status !== 200 || !Array.isArray(adminUsersRes.body.data)) {
      throw new Error(`Admin admins fetch failed: ${JSON.stringify(adminUsersRes.body)}`);
    }
    console.log(`     Admin Users count: ${adminUsersRes.body.data.length}`);

    // Test 12: Admin Activity Logs live fetch
    const logsRes = await request(app)
      .get('/api/v1/admin/logs')
      .set('Authorization', `Bearer ${adminToken}`);
    if (logsRes.status !== 200 || !Array.isArray(logsRes.body.data)) {
      throw new Error(`Admin logs fetch failed: ${JSON.stringify(logsRes.body)}`);
    }
    console.log(`     Admin Activity Logs count: ${logsRes.body.data.length}`);
  });

  // Test 13: Live Technician Endpoints
  await test('Technician API: login, profile, jobs, earnings, and reviews', async () => {
    const techLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'technician@chaircare.com',
      password: 'Password@123',
    });
    if (techLogin.status !== 200 || !techLogin.body.data?.token) {
      throw new Error(`Technician login failed: ${JSON.stringify(techLogin.body)}`);
    }
    const techToken = techLogin.body.data.token;

    // Tech Profile
    const profRes = await request(app)
      .get('/api/v1/technician/profile')
      .set('Authorization', `Bearer ${techToken}`);
    if (profRes.status !== 200 || !profRes.body.data?.name) {
      throw new Error(`Technician profile fetch failed: ${JSON.stringify(profRes.body)}`);
    }
    console.log(`     Technician Profile: ${profRes.body.data.name}, Rating: ${profRes.body.data.rating}`);

    // Tech Jobs
    const jobsRes = await request(app)
      .get('/api/v1/technician/jobs')
      .set('Authorization', `Bearer ${techToken}`);
    if (jobsRes.status !== 200 || !Array.isArray(jobsRes.body.data)) {
      throw new Error(`Technician jobs fetch failed: ${JSON.stringify(jobsRes.body)}`);
    }
    console.log(`     Technician Jobs Queue: ${jobsRes.body.data.length} jobs available`);

    // Tech Earnings
    const earnRes = await request(app)
      .get('/api/v1/technician/earnings')
      .set('Authorization', `Bearer ${techToken}`);
    if (earnRes.status !== 200 || typeof earnRes.body.data?.todayEarnings !== 'number') {
      throw new Error(`Technician earnings fetch failed: ${JSON.stringify(earnRes.body)}`);
    }
    console.log(`     Technician Earnings: Today=₹${earnRes.body.data.todayEarnings}, Week=₹${earnRes.body.data.weeklyEarnings}`);

    // Tech Reviews
    const techRevRes = await request(app)
      .get('/api/v1/technician/reviews')
      .set('Authorization', `Bearer ${techToken}`);
    if (techRevRes.status !== 200 || !Array.isArray(techRevRes.body.data)) {
      throw new Error(`Technician reviews fetch failed: ${JSON.stringify(techRevRes.body)}`);
    }
    console.log(`     Technician Reviews count: ${techRevRes.body.data.length}`);
  });

  // Test 14: Customer live requests
  await test('Customer API: fetch active service requests from Neon', async () => {
    const custReqs = await request(app)
      .get('/api/v1/customer/requests')
      .set('Authorization', `Bearer ${customerToken}`);
    if (custReqs.status !== 200 || !Array.isArray(custReqs.body.data)) {
      throw new Error(`Customer requests fetch failed: ${JSON.stringify(custReqs.body)}`);
    }
    console.log(`     Customer requests count in DB: ${custReqs.body.data.length}`);
  });

  console.log(`\n======================================================`);
  console.log(`🎉 Neon Integration Results: ${passed} passed, ${failed} failed`);
  console.log(`======================================================`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runLiveNeonIntegrationTests().catch((err) => {
  console.error('Fatal live test error:', err);
  process.exit(1);
});
