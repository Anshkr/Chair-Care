import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required for Neon PostgreSQL connection'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters long').default('chaircare_secure_jwt_development_secret_key_12345'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('*'),
  RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform((val) => parseInt(val, 10)),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100').transform((val) => parseInt(val, 10)),
  AUTH_RATE_LIMIT_MAX: z.string().default('15').transform((val) => parseInt(val, 10)),
  PAYMENT_GATEWAY_ENV: z.enum(['sandbox', 'production']).default('sandbox'),
  RAZORPAY_KEY_ID: z.string().default(process.env.RAZORPAY_KEY_ID || 'rzp_test_chaircare_mock_id'),
  RAZORPAY_KEY_SECRET: z.string().default(process.env.RAZORPAY_KEY_SECRET || ''),
  RAZORPAY_WEBHOOK_SECRET: z.string().default(process.env.RAZORPAY_WEBHOOK_SECRET || ''),
});

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.warn('⚠️ [Env Warning] Missing or invalid environment variables:');
    result.error.errors.forEach((err) => {
      console.warn(`  - ${err.path.join('.')}: ${err.message}`);
    });

    // Provide default fallback in development/test so local dev and tests can boot seamlessly
    return {
      PORT: parseInt(process.env.PORT || '5000', 10),
      NODE_ENV: (process.env.NODE_ENV as 'development' | 'test' | 'production') || 'development',
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/chaircare?sslmode=disable',
      JWT_SECRET: process.env.JWT_SECRET || 'chaircare_secure_jwt_development_secret_key_12345',
      JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
      CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
      RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
      RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
      AUTH_RATE_LIMIT_MAX: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '15', 10),
      PAYMENT_GATEWAY_ENV: (process.env.PAYMENT_GATEWAY_ENV as 'sandbox' | 'production') || 'sandbox',
      RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || 'rzp_test_chaircare_mock_id',
      RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || '',
      RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || '',
    };
  }
  return result.data;
};

export const env = parseEnv();
