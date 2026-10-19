"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = require("../src/app");
describe('Health & Root Routes', () => {
    const app = (0, app_1.createApp)();
    it('GET /health returns 200 and healthy status', async () => {
        const res = await (0, supertest_1.default)(app).get('/health');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('status', 'healthy');
        expect(res.body).toHaveProperty('service', 'ChairCare REST API');
    });
    it('GET /non-existent-route returns 404 with error message', async () => {
        const res = await (0, supertest_1.default)(app).get('/api/v1/invalid-route');
        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toContain('Route not found');
    });
});
