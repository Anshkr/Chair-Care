"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const app_1 = require("../src/app");
const env_1 = require("../src/config/env");
describe('Role-Based Access Control (RBAC)', () => {
    const app = (0, app_1.createApp)();
    const customerToken = jsonwebtoken_1.default.sign({ userId: '00000000-0000-0000-0000-000000000001', email: 'cust@test.com', role: 'customer' }, env_1.env.JWT_SECRET);
    const technicianToken = jsonwebtoken_1.default.sign({ userId: '00000000-0000-0000-0000-000000000002', email: 'tech@test.com', role: 'technician' }, env_1.env.JWT_SECRET);
    const adminToken = jsonwebtoken_1.default.sign({ userId: '00000000-0000-0000-0000-000000000003', email: 'admin@test.com', role: 'admin' }, env_1.env.JWT_SECRET);
    it('Customer is forbidden from accessing Admin Dashboard (403)', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/api/v1/admin/dashboard')
            .set('Authorization', `Bearer ${customerToken}`);
        expect(res.status).toBe(403);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toContain('Access denied');
    });
    it('Technician is forbidden from accessing Admin Dashboard (403)', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/api/v1/admin/dashboard')
            .set('Authorization', `Bearer ${technicianToken}`);
        expect(res.status).toBe(403);
        expect(res.body.success).toBe(false);
    });
    it('Customer cannot create technician availability updates (403)', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/api/v1/technician/availability')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({ isOnline: true });
        expect(res.status).toBe(403);
        expect(res.body.success).toBe(false);
    });
    it('Technician cannot post customer booking requests (403)', async () => {
        const res = await (0, supertest_1.default)(app)
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
        const res = await (0, supertest_1.default)(app)
            .post('/api/v1/customer/requests')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({
            chairModel: '',
        });
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });
});
