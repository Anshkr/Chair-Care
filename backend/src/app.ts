import express, { Express, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env';
import { query } from './config/database';
import { errorHandler } from './middleware/errorHandler';

// Route imports
import authRoutes from './routes/authRoutes';
import serviceRoutes from './routes/serviceRoutes';
import customerRoutes from './routes/customerRoutes';
import technicianRoutes from './routes/technicianRoutes';
import adminRoutes from './routes/adminRoutes';
import notificationRoutes from './routes/notificationRoutes';
import chatRoutes from './routes/chatRoutes';

export const createApp = (): Express => {
  const app = express();

  // Security Headers
  app.use(helmet());

  // CORS configuration
  app.use(
    cors({
      origin: (origin, callback) => {
        // In local development, allow any origin (Expo Web localhost, mobile IP, simulator)
        if (env.NODE_ENV === 'development' || !origin) {
          return callback(null, true);
        }
        if (origin === env.CORS_ORIGIN) {
          return callback(null, true);
        }
        return callback(null, true);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Body Parsing (Allow document and ID proof image/pdf uploads)
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // Health handler reporting API & Database status without exposing credentials
  const healthHandler = async (req: Request, res: Response) => {
    const startTime = Date.now();
    let dbStatus = 'disconnected';
    let dbLatencyMs = 0;

    try {
      const dbCheck = await query('SELECT 1 as is_alive, NOW() as server_time;');
      if (dbCheck.rows.length > 0) {
        dbStatus = 'connected';
        dbLatencyMs = Date.now() - startTime;
      }
    } catch (err: any) {
      dbStatus = 'disconnected';
    }

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'ChairCare REST API',
      version: '1.0.0',
      environment: env.NODE_ENV,
      database: {
        status: dbStatus,
        driver: 'pg (PostgreSQL on Neon)',
        ssl: true,
        latencyMs: dbLatencyMs,
      },
    });
  };

  // Health check endpoints
  app.get('/health', healthHandler);
  app.get('/api/health', healthHandler);

  // Versioned API v1 Router
  const apiV1 = express.Router();
  apiV1.get('/health', healthHandler);
  apiV1.use('/auth', authRoutes);
  apiV1.use('/services', serviceRoutes);
  apiV1.use('/customer', customerRoutes);
  apiV1.use('/technician', technicianRoutes);
  apiV1.use('/admin', adminRoutes);
  apiV1.use('/notifications', notificationRoutes);
  apiV1.use('/chat', chatRoutes);

  app.use('/api/v1', apiV1);

  // 404 Handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: `Route not found: ${req.method} ${req.originalUrl}`,
    });
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
};
