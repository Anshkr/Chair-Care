"use strict";
// Mock database queries for unit and security tests
jest.mock('../src/config/database', () => ({
    __esModule: true,
    default: {
        query: jest.fn().mockResolvedValue({ rows: [] }),
        connect: jest.fn().mockResolvedValue({
            query: jest.fn().mockResolvedValue({ rows: [] }),
            release: jest.fn(),
        }),
        on: jest.fn(),
    },
    query: jest.fn().mockImplementation((text, params) => {
        // Return appropriate mock responses for test queries
        if (text.includes('SELECT NOW()')) {
            return Promise.resolve({ rows: [{ current_time: new Date(), db_name: 'chaircare_test' }] });
        }
        if (text.includes('FROM services')) {
            return Promise.resolve({
                rows: [
                    {
                        id: '11111111-1111-1111-1111-111111111111',
                        code: 'HYDRAULIC_REPLACE',
                        title: 'Hydraulic Cylinder Replacement',
                        description: 'Fix gas lift cylinder',
                        estimated_price: 1299.0,
                        duration_minutes: 45,
                        badge: 'Popular',
                        image_url: null,
                    },
                ],
            });
        }
        return Promise.resolve({ rows: [] });
    }),
    getClient: jest.fn().mockResolvedValue({
        query: jest.fn().mockResolvedValue({ rows: [] }),
        release: jest.fn(),
    }),
    checkDatabaseConnection: jest.fn().mockResolvedValue(true),
}));
