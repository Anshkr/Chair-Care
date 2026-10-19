const { Pool } = require('pg');
require('dotenv').config({ path: 'd:/OffhemanProjects/Chair-Service-platform/ChairCare/backend/.env' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
    const res = await pool.query("SELECT id, tracking_code, total_amount, is_paid, status, customer_id, chair_model, issue_description FROM service_requests WHERE customer_id = '95769219-053b-45fb-945c-91b04f63ed4d';");
    console.log('Customer Requests:', res.rows);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    pool.end();
  }
}
run();
