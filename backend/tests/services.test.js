"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = require("../src/app");
describe('Service Catalogue API', () => {
    const app = (0, app_1.createApp)();
    it('GET /api/v1/services returns list of active services', async () => {
        const res = await (0, supertest_1.default)(app).get('/api/v1/services');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBeGreaterThan(0);
        expect(res.body.data[0]).toHaveProperty('code', 'HYDRAULIC_REPLACE');
        expect(res.body.data[0]).toHaveProperty('estimatedPrice', 1299);
    });
});
