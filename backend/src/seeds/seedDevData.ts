import bcrypt from 'bcryptjs';
import { query } from '../config/database';
import { env } from '../config/env';

export const seedDevData = async (): Promise<void> => {
  if (env.NODE_ENV === 'production') {
    console.warn('⚠️ [Seed]: Seeding skipped in production environment.');
    return;
  }

  console.log('🌱 [Seed]: Seeding initial development catalog and demo accounts...');

  const passwordHash = await bcrypt.hash('Password@123', 10);

  // 1. Seed All 8 Core Services
  const initialServices = [
    {
      code: 'REPAIR_TILT_FRAME',
      title: 'Repair (Fix tilt & frame)',
      description: 'Fix broken mechanisms, tilt lock slippage, sheared bolts, and wobbly squeaky frames.',
      estimated_price: 599.0,
      duration_minutes: 45,
      badge: 'Popular',
    },
    {
      code: 'INSTALLATION_NEW_SETUP',
      title: 'Installation (New chair setup)',
      description: 'Professional new chair assembly, precision bolt torquing, and zero-drift tilt alignment.',
      estimated_price: 799.0,
      duration_minutes: 30,
      badge: 'Assembly',
    },
    {
      code: 'MAINTENANCE_TUNEUP',
      title: 'Maintenance (Lube & tune-up)',
      description: 'Complete mechanical lubrication, joint torquing, structural tune-up, and noise suppression.',
      estimated_price: 499.0,
      duration_minutes: 35,
      badge: 'Tune-up',
    },
    {
      code: 'CASTOR_WHEEL_FIX',
      title: 'Wheel Replace (Smooth casters)',
      description: 'Replace jammed or cracked wheels with floor-safe high-durability polyurethane rollerblade castors.',
      estimated_price: 449.0,
      duration_minutes: 30,
      badge: 'Fast',
    },
    {
      code: 'HYDRAULIC_REPLACE',
      title: 'Gas Lift (Sinking height fix)',
      description: 'Resolve downward sinking with heavy-duty Class-4 pneumatic nitrogen gas lift cylinder.',
      estimated_price: 899.0,
      duration_minutes: 45,
      badge: 'Class-4',
    },
    {
      code: 'ARMREST_CUSHION_REPAIR',
      title: 'Armrest (Pads & brackets)',
      description: '3D/4D multi-directional armrest mechanism overhaul or polyurethane cushion pad replacement.',
      estimated_price: 549.0,
      duration_minutes: 40,
      badge: 'Spare Parts',
    },
    {
      code: 'FULL_ERGONOMIC_SPA',
      title: 'Cleaning (Deep steam wash)',
      description: 'High-temperature deep antimicrobial extraction, fabric foam wash, and ultrasonic mesh sanitization.',
      estimated_price: 399.0,
      duration_minutes: 40,
      badge: 'Sanitized',
    },
    {
      code: 'INSPECTION_HEALTH_AUDIT',
      title: 'Inspection (Health audit)',
      description: '12-point comprehensive ergonomic health audit, chassis stress diagnosis, and safety checkup.',
      estimated_price: 299.0,
      duration_minutes: 25,
      badge: 'Audit',
    },
  ];

  for (const s of initialServices) {
    await query(
      `INSERT INTO services (code, title, description, estimated_price, duration_minutes, badge, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE)
       ON CONFLICT (code) DO UPDATE
       SET title = EXCLUDED.title,
           description = EXCLUDED.description,
           estimated_price = EXCLUDED.estimated_price,
           duration_minutes = EXCLUDED.duration_minutes,
           badge = EXCLUDED.badge;`,
      [s.code, s.title, s.description, s.estimated_price, s.duration_minutes, s.badge]
    );
  }

  // 2. Seed Demo Admin
  const adminRes = await query(
    `INSERT INTO users (email, phone, name, password_hash, role, is_active)
     VALUES ($1, $2, $3, $4, 'admin', TRUE)
     ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
     RETURNING id;`,
    ['admin@chaircare.com', '+91 98765 43210', 'Operations Lead (Super Admin)', passwordHash]
  );
  const adminId = adminRes.rows[0].id;

  // 3. Seed Demo Customer
  const custRes = await query(
    `INSERT INTO users (email, phone, name, password_hash, role, is_active)
     VALUES ($1, $2, $3, $4, 'customer', TRUE)
     ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
     RETURNING id;`,
    ['customer@chaircare.com', '+91 91234 56789', 'Ananya Sharma', passwordHash]
  );
  const customerId = custRes.rows[0].id;

  await query(
    `INSERT INTO customer_profiles (user_id, default_address, loyalty_points)
     VALUES ($1, $2, 120)
     ON CONFLICT (user_id) DO NOTHING;`,
    [customerId, 'Tower 4, Apt 1102, Cyber Heights, Sector 62, Gurgaon']
  );

  // 4. Seed Demo Technician
  const techRes = await query(
    `INSERT INTO users (email, phone, name, password_hash, role, is_active)
     VALUES ($1, $2, $3, $4, 'technician', TRUE)
     ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash, is_active = TRUE
     RETURNING id;`,
    ['technician@chaircare.com', '+91 99887 76655', 'Rajesh Kumar', passwordHash]
  );
  const technicianId = techRes.rows[0].id;

  await query(
    `INSERT INTO technician_profiles (user_id, rating, completed_jobs_count, is_online, verification_status, current_zone, vehicle_info, experience_years, specializations, today_earnings)
     VALUES ($1, 4.92, 184, TRUE, 'verified', 'Gurgaon North & Cyber City', 'Hero Splendor (DL-04-AB-1234)', 8, 'Hydraulic Tuning, Multi-Angle Tilt Lock, Herman Miller & Steelcase', 2450.00)
     ON CONFLICT (user_id) DO UPDATE SET verification_status = 'verified', is_online = TRUE;`,
    [technicianId]
  );

  // 4b. Seed Demo Technician - Ramesh Verma
  const rameshRes = await query(
    `INSERT INTO users (email, phone, name, password_hash, role, is_active)
     VALUES ($1, $2, $3, $4, 'technician', TRUE)
     ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash, is_active = TRUE
     RETURNING id;`,
    ['ramesh.verma@chaircare.in', '+91 98112 23344', 'Ramesh Verma', passwordHash]
  );
  const rameshId = rameshRes.rows[0]?.id;

  if (rameshId) {
    await query(
      `INSERT INTO technician_profiles (user_id, rating, completed_jobs_count, is_online, verification_status, current_zone, vehicle_info, experience_years, specializations, today_earnings)
       VALUES ($1, 5.00, 42, TRUE, 'verified', 'South Delhi & Gurugram', 'Mobile Service Van (DL-08-CC-4422)', 6, 'Castor Overhaul, Armrest Brackets, Class-4 Gas Struts', 1850.00)
       ON CONFLICT (user_id) DO UPDATE SET verification_status = 'verified', is_online = TRUE;`,
      [rameshId]
    );
  }

  // 5. Seed Sample Active Service Request
  const srvHydraulic = await query(`SELECT id FROM services WHERE code = 'HYDRAULIC_REPLACE' LIMIT 1;`);
  const serviceId = srvHydraulic.rows[0]?.id;

  const reqRes = await query(
    `INSERT INTO service_requests (
      tracking_code, customer_id, technician_id, service_id,
      chair_model, issue_description, status, address, unit_floor,
      time_slot, visit_date, total_amount, is_paid, payment_method, security_pin
    ) VALUES (
      'CC-8942', $1, $2, $3,
      'Herman Miller Aeron (Size B)', 'Cylinder slowly sinks down over 15 minutes of sitting.',
      'completed', 'Tower 4, Apt 1102, Cyber Heights, Sector 62, Gurgaon', '11th Floor',
      '02:00 PM - 04:00 PM', 'Today', 1299.00, TRUE, 'UPI', '8492'
    ) ON CONFLICT (tracking_code) DO NOTHING
    RETURNING id;`,
    [customerId, technicianId, serviceId]
  );

  const reqId = reqRes.rows[0]?.id;
  if (reqId) {
    await query(
      `INSERT INTO service_status_history (request_id, status, updated_by, notes)
       VALUES ($1, 'in_route', $2, 'Technician en route with replacement Class 4 gas lift.');`,
      [reqId, technicianId]
    );

    await query(
      `INSERT INTO payments (request_id, amount, currency, status, provider, transaction_id)
       VALUES ($1, 1299.00, 'INR', 'completed', 'mock_gateway', 'txn_demo_8942_success')
       ON CONFLICT (transaction_id) DO NOTHING;`,
      [reqId]
    );
  }

  // 6. Seed Completed Service Requests & Customer Reviews for live history
  const srvRepair = await query(`SELECT id FROM services WHERE code = 'REPAIR_TILT_FRAME' LIMIT 1;`);
  const repairId = srvRepair.rows[0]?.id || serviceId;

  const completedRequests = [
    {
      code: 'CC-8810',
      model: 'Herman Miller Aeron',
      issue: 'Tilt limiter slipping under recline tension.',
      amount: 899.0,
      rating: 5,
      comment: 'Rajesh fixed the tilt lock mechanism in 35 mins. Chair feels solid and brand new!',
      date: 'Yesterday',
    },
    {
      code: 'CC-8745',
      model: 'Steelcase Gesture',
      issue: 'Armrest bracket wobble and height adjustment stickiness.',
      amount: 649.0,
      rating: 5,
      comment: 'Very punctual and polite technician. Carried genuine OEM replacement parts.',
      date: '3 days ago',
    },
    {
      code: 'CC-8620',
      model: 'Haworth Fern',
      issue: 'Gas lift sinking slowly during afternoon work sessions.',
      amount: 1199.0,
      rating: 5,
      comment: 'Arrived right on time. Highly recommend Rajesh for ergonomic chair repairs.',
      date: '5 days ago',
    },
    {
      code: 'CC-8501',
      model: 'Humanscale Freedom',
      issue: 'Full ergonomic maintenance, noise suppression & lubrication.',
      amount: 499.0,
      rating: 4,
      comment: 'Good service, eliminated all squeaking sounds from the base mechanism.',
      date: '1 week ago',
    },
  ];

  for (const cr of completedRequests) {
    const crRes = await query(
      `INSERT INTO service_requests (
        tracking_code, customer_id, technician_id, service_id,
        chair_model, issue_description, status, address, unit_floor,
        time_slot, visit_date, total_amount, is_paid, payment_method,
        warranty_valid_until
      ) VALUES (
        $1, $2, $3, $4,
        $5, $6, 'completed', 'Tower 2, Cyber City, Sector 24, Gurgaon', '4th Floor',
        '11:00 AM - 01:00 PM', $7, $8, TRUE, 'UPI',
        NOW() + interval '90 days'
      ) ON CONFLICT (tracking_code) DO NOTHING
      RETURNING id;`,
      [cr.code, customerId, technicianId, repairId, cr.model, cr.issue, cr.date, cr.amount]
    );

    const crId = crRes.rows[0]?.id;
    if (crId) {
      await query(
        `INSERT INTO reviews (request_id, customer_id, technician_id, rating, comment)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (request_id) DO NOTHING;`,
        [crId, customerId, technicianId, cr.rating, cr.comment]
      );
    }
  }

  console.log('✅ [Seed]: Seeded catalog, users (customer, technician, admin), initial active request, and completed history with customer reviews.');
};

if (require.main === module) {
  seedDevData()
    .then(() => {
      console.log('Done seeding dev data.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seeding failed:', err);
      process.exit(1);
    });
}
