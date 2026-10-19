import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app';
import { env } from '../src/config/env';

describe('Role-Based Access Control (RBAC)', () => {
  const app = createApp();

  const customerToken = jwt.sign(
    { userId: '00000000-0000-0000-0000-000000000001', email: 'cust@test.com', role: 'customer' },
    env.JWT_SECRET
  );

  const technicianToken = jwt.sign(
    { userId: '00000000-0000-0000-0000-000000000002', email: 'tech@test.com', role: 'technician' },
    env.JWT_SECRET
  );

  const adminToken = jwt.sign(
    { userId: '00000000-0000-0000-0000-000000000003', email: 'admin@test.com', role: 'admin' },
    env.JWT_SECRET
  );

  it('Customer is forbidden from accessing Admin Dashboard (403)', async () => {
    const res = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Access denied');
  });

  it('Technician is forbidden from accessing Admin Dashboard (403)', async () => {
    const res = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${technicianToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('Customer cannot create technician availability updates (403)', async () => {
    const res = await request(app)
      .post('/api/v1/technician/availability')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ isOnline: true });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('Technician cannot post customer booking requests (403)', async () => {
    const res = await request(app)
      .post('/api/v1/customer/requests')
      .set('Authorization', `Bearer ${technicianToken}`)
      .send({
        chairModel: 'Steelcase Gesture',
        issueDescription: 'Armrest loose',
        address: 'MG Road, Bangalore',
        timeSlot: '10 AM - 12 PM',
        visitDate: 'Tomorrow',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('Customer booking request fails validation if missing required fields', async () => {
    const res = await request(app)
      .post('/api/v1/customer/requests')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        chairModel: '',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
