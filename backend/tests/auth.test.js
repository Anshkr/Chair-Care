"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = require("../src/app");
describe('Auth Validation & Security Endpoints', () => {
    const app = (0, app_1.createApp)();
    it('POST /api/v1/auth/register fails with invalid payload (missing fields)', async () => {
        const res = await (0, supertest_1.default)(app).post('/api/v1/auth/register').send({
            email: 'not-an-email',
            password: '123',
        });
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toBe('Validation failed');
        expect(res.body.details).toBeInstanceOf(Array);
    });
    it('POST /api/v1/auth/login fails when credentials are missing', async () => {
        const res = await (0, supertest_1.default)(app).post('/api/v1/auth/login').send({});
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });
    it('GET /api/v1/auth/me rejects request without bearer token with 401', async () => {
        const res = await (0, supertest_1.default)(app).get('/api/v1/auth/me');
        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toBe('Authentication token required.');
    });
    it('GET /api/v1/auth/me rejects invalid bearer token with 403', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/api/v1/auth/me')
            .set('Authorization', 'Bearer invalid-token-payload');
        expect(res.status).toBe(403);
        expect(res.body.success).toBe(false);
    });
});
