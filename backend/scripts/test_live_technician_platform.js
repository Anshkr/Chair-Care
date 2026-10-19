const http = require('http');

const BASE_URL = 'http://localhost:5000';

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({ status: res.statusCode, body: json });
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('CHAIRCARE TECHNICIAN PLATFORM LIVE AUDIT & E2E TESTS');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  // 1. Health & Database check
  console.log('1. Verifying Live API & Neon PostgreSQL Health...');
  const healthRes = await request('GET', '/api/health');
  assert(healthRes.status === 200 && healthRes.body.database?.status === 'connected', 'Backend API is connected to Neon PostgreSQL');

  // Test credentials
  const ts = Date.now();
  const customerEmail = `audit_cust_${ts}@chaircare.test`;
  const tech1Email = `audit_tech1_${ts}@chaircare.test`;
  const tech2Email = `audit_tech2_${ts}@chaircare.test`;
  const password = 'Password@123';

  // 2. Register Customer
  console.log('\n2. Testing Customer Registration & Session...');
  const regCustRes = await request('POST', '/api/v1/auth/register', {
    name: 'Audit Customer',
    email: customerEmail,
    password: password,
    role: 'customer',
  });
  assert(regCustRes.status === 201 && regCustRes.body.data?.token, 'Customer registered successfully with customer role');
  const customerToken = regCustRes.body.data?.token;
  const customerUser = regCustRes.body.data?.user;

  // 3. Customer Role Isolation: Customer attempts to call Technician API
  console.log('\n3. Testing Cross-Role Boundary: Customer calling Technician API...');
  const custTechAccess = await request('GET', '/api/v1/technician/jobs', null, customerToken);
  assert(custTechAccess.status === 403, `Customer access to /api/v1/technician/jobs rejected with 403 Forbidden (Actual: ${custTechAccess.status})`);

  // 4. Customer Role Isolation: Customer attempts to call Admin API
  console.log('\n4. Testing Cross-Role Boundary: Customer calling Admin API...');
  const custAdminAccess = await request('GET', '/api/v1/admin/dashboard', null, customerToken);
  assert(custAdminAccess.status === 403, `Customer access to /api/v1/admin/dashboard rejected with 403 Forbidden (Actual: ${custAdminAccess.status})`);

  // 5. Register Technician 1
  console.log('\n5. Registering Technician 1 & Verifying Profile...');
  const regTech1Res = await request('POST', '/api/v1/auth/register', {
    name: 'Master Tech 1',
    email: tech1Email,
    password: password,
    role: 'technician',
  });
  assert(regTech1Res.status === 201 && regTech1Res.body.data?.token, 'Technician 1 registered with technician role');
  const tech1Token = regTech1Res.body.data?.token;
  const tech1User = regTech1Res.body.data?.user;

  // 6. Register Technician 2
  console.log('\n6. Registering Technician 2 for Race Condition & Isolation Testing...');
  const regTech2Res = await request('POST', '/api/v1/auth/register', {
    name: 'Master Tech 2',
    email: tech2Email,
    password: password,
    role: 'technician',
  });
  assert(regTech2Res.status === 201 && regTech2Res.body.data?.token, 'Technician 2 registered with technician role');
  const tech2Token = regTech2Res.body.data?.token;
  const tech2User = regTech2Res.body.data?.user;

  // Verify both technicians via Admin API
  console.log('\n6b. Admin Verifying Technician Credentials...');
  const adminLoginRes = await request('POST', '/api/v1/auth/login', {
    email: 'admin@chaircare.com',
    password: 'Password@123',
  });
  assert(adminLoginRes.status === 200 && adminLoginRes.body.data?.token, 'Super Admin logged in successfully');
  const adminToken = adminLoginRes.body.data?.token;

  const verifyTech1 = await request('PATCH', `/api/v1/admin/technicians/${tech1User.id}/verify`, {
    verificationStatus: 'verified',
  }, adminToken);
  assert(verifyTech1.status === 200, 'Technician 1 verified by Super Admin');

  const verifyTech2 = await request('PATCH', `/api/v1/admin/technicians/${tech2User.id}/verify`, {
    verificationStatus: 'verified',
  }, adminToken);
  assert(verifyTech2.status === 200, 'Technician 2 verified by Super Admin');

  // 7. Technician Role Isolation: Technician calling Admin API
  console.log('\n7. Testing Cross-Role Boundary: Technician calling Admin API...');
  const techAdminAccess = await request('GET', '/api/v1/admin/dashboard', null, tech1Token);
  assert(techAdminAccess.status === 403, `Technician access to /api/v1/admin/dashboard rejected with 403 Forbidden (Actual: ${techAdminAccess.status})`);

  // 8. Technician Availability & Verification
  console.log('\n8. Updating Technician 1 Availability & Verification Status...');
  const availRes = await request('POST', '/api/v1/technician/availability', { isOnline: true, activeZone: 'Zone 4A' }, tech1Token);
  assert(availRes.status === 200, 'Technician availability updated to online in database');

  // Also make Tech 2 online
  await request('POST', '/api/v1/technician/availability', { isOnline: true, activeZone: 'Zone 4A' }, tech2Token);

  // 9. Customer creates real booking request
  console.log('\n9. Creating Real Service Request by Customer...');
  const bookRes = await request('POST', '/api/v1/customer/requests', {
    serviceCode: 'HYDRAULIC_REPLACE',
    chairModel: 'Herman Miller Aeron Size B',
    issueDescription: 'Cylinder sinking under pressure, tilt lock loose',
    address: 'Palm Springs Sector 54, Gurugram',
    unitFloor: 'Tower B, Suite 402',
    timeSlot: '10:00 AM - 01:00 PM',
    visitDate: '2026-10-15',
    totalAmount: 1200,
  }, customerToken);
  assert(bookRes.status === 201 && bookRes.body.data?.id, `Booking request created with ID: ${bookRes.body.data?.id}`);
  const requestId = bookRes.body.data?.id;

  // 10. Technician 1 checks available broadcast jobs
  console.log('\n10. Fetching Broadcast Jobs for Verified Technicians...');
  const jobsRes = await request('GET', '/api/v1/technician/jobs', null, tech1Token);
  assert(jobsRes.status === 200 && Array.isArray(jobsRes.body.data), 'Technician fetched active jobs queue');
  const foundJob = jobsRes.body.data?.find((j) => j.id === requestId);
  assert(foundJob !== undefined, `Created job ${requestId} appears in technician broadcast pool`);

  // 11. Atomic Acceptance: Technician 1 accepts job
  console.log('\n11. Testing Atomic Job Acceptance...');
  const acceptRes1 = await request('POST', `/api/v1/technician/jobs/${requestId}/accept`, {}, tech1Token);
  assert(acceptRes1.status === 200 && acceptRes1.body.data?.status === 'assigned', 'Technician 1 atomically accepted job (status=assigned)');

  // 12. Competing Technician Conflict: Technician 2 tries to accept the already-accepted job
  console.log('\n12. Testing Competing Technician Conflict (409 Conflict)...');
  const acceptRes2 = await request('POST', `/api/v1/technician/jobs/${requestId}/accept`, {}, tech2Token);
  assert(acceptRes2.status === 409, `Second technician rejected with 409 Conflict (Actual: ${acceptRes2.status})`);

  // 13. Data Isolation: Technician 2 cannot access Technician 1's assigned job details
  console.log('\n13. Testing Job Ownership Isolation between Technicians...');
  const tech2JobAccess = await request('GET', `/api/v1/customer/requests/${requestId}`, null, tech2Token);
  assert(tech2JobAccess.status === 403, `Technician 2 cannot access Technician 1's assigned job (403 Forbidden, Actual: ${tech2JobAccess.status})`);

  // 14. Real Job Status Transitions
  console.log('\n14. Testing Lifecycle Status Transitions...');
  // in_route
  const statusRoute = await request('PATCH', `/api/v1/technician/jobs/${requestId}/status`, { status: 'in_route' }, tech1Token);
  assert(statusRoute.status === 200 && statusRoute.body.data?.status === 'in_route', 'Status updated to in_route');

  // arrived
  const statusArrived = await request('PATCH', `/api/v1/technician/jobs/${requestId}/status`, { status: 'arrived' }, tech1Token);
  assert(statusArrived.status === 200 && statusArrived.body.data?.status === 'arrived', 'Status updated to arrived');

  // in_progress
  const statusProgress = await request('PATCH', `/api/v1/technician/jobs/${requestId}/status`, { status: 'in_progress' }, tech1Token);
  assert(statusProgress.status === 200 && statusProgress.body.data?.status === 'in_progress', 'Status updated to in_progress');

  // completed
  const statusCompleted = await request('PATCH', `/api/v1/technician/jobs/${requestId}/status`, { status: 'completed' }, tech1Token);
  assert(statusCompleted.status === 200 && statusCompleted.body.data?.status === 'completed', 'Status updated to completed');

  // 15. Real Earnings Calculation: Commission verified
  console.log('\n15. Verifying Real Technician Earnings (70% Commission)...');
  const earningsRes = await request('GET', '/api/v1/technician/earnings', null, tech1Token);
  assert(earningsRes.status === 200, 'Technician fetched earnings ledger');
  const expectedCommission = 1200 * 0.7; // 840
  console.log(`    Expected commission: Rs ${expectedCommission}, Today Earnings: Rs ${earningsRes.body.data?.todayEarnings}`);
  assert(earningsRes.body.data?.todayEarnings >= expectedCommission, `Commission credited to technician's real earnings ledger`);

  // 16. Customer Reviews Flow & Technician Reviews Fetch
  console.log('\n16. Testing Real Customer Reviews & Feedback...');
  const reviewPost = await request('POST', '/api/v1/customer/reviews', {
    requestId,
    rating: 5,
    comment: 'Outstanding repair. Hydraulic lift and tilt function operate like new.',
  }, customerToken);
  assert(reviewPost.status === 201 || reviewPost.status === 200, 'Customer submitted verified 5-star review');

  const techReviews = await request('GET', '/api/v1/technician/reviews', null, tech1Token);
  assert(techReviews.status === 200 && Array.isArray(techReviews.body.data), 'Technician fetched reviews list from Neon database');
  const matchReview = techReviews.body.data?.find((r) => r.request_id === requestId || r.rating === 5);
  assert(matchReview !== undefined, 'Customer review appears in technician reviews feed');

  // 17. Security: Invalid or Expired Token Rejection
  console.log('\n17. Testing Expired / Tampered Token Rejection...');
  const badTokenRes = await request('GET', '/api/v1/technician/jobs', null, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature');
  assert(badTokenRes.status === 403 || badTokenRes.status === 401, `Invalid bearer token rejected with ${badTokenRes.status}`);

  console.log('\n====================================================');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
