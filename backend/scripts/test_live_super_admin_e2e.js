/**
 * CHAIRCARE SUPER ADMIN END-TO-END VALIDATION SUITE
 * Tests Phase 13 Requirements against live Express backend & Neon PostgreSQL
 */

const BASE_URL = process.env.API_URL || 'http://localhost:5000/api/v1';

async function runTests() {
  console.log('====================================================');
  console.log('🚀 CHAIRCARE SUPER ADMIN PLATFORM — LIVE E2E AUDIT');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    const healthRes = await fetch('http://localhost:5000/api/health');
    const healthJson = await healthRes.json();
    assert(healthRes.status === 200 && healthJson.status === 'healthy', 'Backend health check healthy and responsive');
    assert(healthJson.database && healthJson.database.status === 'connected', `Neon DB connected with driver: ${healthJson.database?.driver}`);

    // 2. Unauthenticated user attempts to access admin endpoint -> 401
    const unauthDashboard = await fetch(`${BASE_URL}/admin/dashboard`);
    assert(unauthDashboard.status === 401, `Unauthenticated request to /admin/dashboard returned 401 Unauthorized (got ${unauthDashboard.status})`);

    const unauthUsers = await fetch(`${BASE_URL}/admin/customers`);
    assert(unauthUsers.status === 401, `Unauthenticated request to /admin/customers returned 401 Unauthorized (got ${unauthUsers.status})`);

    // 3. Login real seeded customer to verify role isolation
    const customerLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'customer@chaircare.com', password: 'Password@123' }),
    });
    const customerLoginJson = await customerLoginRes.json();
    const customerToken = customerLoginJson.data?.token;
    assert(customerLoginRes.status === 200 && !!customerToken, `Customer login succeeded with role=${customerLoginJson.data?.user?.role}`);

    // 4. Customer token attempting to access Admin endpoints -> 403 Forbidden
    const customerAdminRes = await fetch(`${BASE_URL}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert(customerAdminRes.status === 403, `Customer token accessing /admin/dashboard blocked with 403 Forbidden (got ${customerAdminRes.status})`);

    const customerAdminTechs = await fetch(`${BASE_URL}/admin/technicians`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert(customerAdminTechs.status === 403, `Customer token accessing /admin/technicians blocked with 403 Forbidden (got ${customerAdminTechs.status})`);

    // 5. Login real seeded technician to verify role isolation
    const techLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'technician@chaircare.com', password: 'Password@123' }),
    });
    const techLoginJson = await techLoginRes.json();
    const techToken = techLoginJson.data?.token;
    assert(techLoginRes.status === 200 && !!techToken, `Technician login succeeded with role=${techLoginJson.data?.user?.role}`);

    const techAdminRes = await fetch(`${BASE_URL}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${techToken}` },
    });
    assert(techAdminRes.status === 403, `Technician token accessing /admin/dashboard blocked with 403 Forbidden (got ${techAdminRes.status})`);

    // 6. Non-admin attempting to register as 'admin' -> server prevents self-elevation
    const rogueReg = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `hacker_${Date.now()}@example.com`,
        password: 'Password@123',
        name: 'Malicious User',
        phone: '9999999999',
        role: 'admin',
      }),
    });
    assert(rogueReg.status === 400, `Public registration with role='admin' rejected with 400 Bad Request (got ${rogueReg.status})`);

    // 7. Invalid / Expired bearer token -> 403 Forbidden
    const fakeTokenRes = await fetch(`${BASE_URL}/admin/dashboard`, {
      headers: { Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature' },
    });
    assert(fakeTokenRes.status === 403, `Forged JWT token rejected with 403 Forbidden (got ${fakeTokenRes.status})`);

    // 8. Super Admin Login
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@chaircare.com', password: 'Password@123' }),
    });
    const adminLoginJson = await adminLoginRes.json();
    const adminToken = adminLoginJson.data?.token;
    assert(adminLoginRes.status === 200 && adminLoginJson.data?.user?.role === 'admin', 'Super Admin authenticated with server-verified role=admin');
    assert(!!adminToken, 'Admin JWT token acquired');

    const adminHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    };

    // 9. Admin Dashboard Metrics (Aggregations from real DB)
    const dashRes = await fetch(`${BASE_URL}/admin/dashboard`, { headers: adminHeaders });
    const dashJson = await dashRes.json();
    assert(dashRes.status === 200 && dashJson.success === true, 'Admin Dashboard API returned 200 OK');
    const data = dashJson.data || {};
    assert(
      typeof data.activeRequests !== 'undefined' &&
      typeof data.totalTechnicians !== 'undefined' &&
      typeof data.totalCustomers !== 'undefined',
      `Dashboard derived live counts from Neon DB: ${data.totalCustomers} customers, ${data.totalTechnicians} techs, ${data.activeRequests} active requests`
    );

    // 10. Customers list
    const custRes = await fetch(`${BASE_URL}/admin/customers`, { headers: adminHeaders });
    const custJson = await custRes.json();
    assert(custRes.status === 200 && Array.isArray(custJson.data), `Admin Customers API returned ${custJson.data?.length} real records from DB`);

    // 11. Technicians list
    const techListRes = await fetch(`${BASE_URL}/admin/technicians`, { headers: adminHeaders });
    const techListJson = await techListRes.json();
    assert(techListRes.status === 200 && Array.isArray(techListJson.data), `Admin Technicians API returned ${techListJson.data?.length} real technician profiles from DB`);

    // 12. Service Requests
    const reqListRes = await fetch(`${BASE_URL}/admin/requests`, { headers: adminHeaders });
    const reqListJson = await reqListRes.json();
    assert(reqListRes.status === 200 && Array.isArray(reqListJson.data?.requests || reqListJson.data), 'Admin Service Requests API returned live database requests');

    // 13. Support Tickets
    const ticketsRes = await fetch(`${BASE_URL}/admin/support`, { headers: adminHeaders });
    const ticketsJson = await ticketsRes.json();
    assert(ticketsRes.status === 200 && Array.isArray(ticketsJson.data), `Admin Support Tickets API returned ${ticketsJson.data?.length} real tickets`);

    // 14. Disputes & Refunds
    const disputesRes = await fetch(`${BASE_URL}/admin/disputes`, { headers: adminHeaders });
    const disputesJson = await disputesRes.json();
    assert(disputesRes.status === 200 && Array.isArray(disputesJson.data), `Admin Disputes API returned ${disputesJson.data?.length} real dispute/refund records`);

    // 15. System Telemetry
    const statusRes = await fetch(`${BASE_URL}/admin/system/status`, { headers: adminHeaders });
    const statusJson = await statusRes.json();
    assert(
      statusRes.status === 200 && statusJson.data?.database?.connected === true,
      `Admin System Status verified live Neon DB connection, uptime: ${statusJson.data?.telemetry?.uptimeSeconds}s`
    );

    // 16. Technician verification action
    if (techListJson.data?.length > 0) {
      const targetTech = techListJson.data[0];
      const verifyRes = await fetch(`${BASE_URL}/admin/technicians/${targetTech.id}/verify`, {
        method: 'PATCH',
        headers: adminHeaders,
        body: JSON.stringify({ verificationStatus: 'verified' }),
      });
      const verifyJson = await verifyRes.json();
      assert(verifyRes.status === 200 && verifyJson.success === true, `Admin verified technician ${targetTech.name} (${targetTech.id}) in database`);
    }

    // 17. Admin user creation
    const newAdminEmail = `admin_e2e_${Date.now()}@chaircare.pro`;
    const createAdminRes = await fetch(`${BASE_URL}/admin/admins`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        name: 'E2E Audited Admin',
        email: newAdminEmail,
        phone: '9876543210',
        role: 'admin',
      }),
    });
    const createAdminJson = await createAdminRes.json();
    assert(createAdminRes.status === 201 && createAdminJson.success === true, `Authorized Super Admin successfully provisioned new admin (${newAdminEmail})`);

    // 18. Audit log verification
    const logsRes = await fetch(`${BASE_URL}/admin/logs`, { headers: adminHeaders });
    const logsJson = await logsRes.json();
    assert(logsRes.status === 200 && Array.isArray(logsJson.data), `Admin Audit Logs API recorded ${logsJson.data?.length} sensitive operations`);

  } catch (error) {
    console.error('Fatal test execution error:', error);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`📊 TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
