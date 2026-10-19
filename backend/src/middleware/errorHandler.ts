import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('💥 [Unhandled API Error]:', {
    message: err.message,
    stack: env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.url,
    method: req.method,
  });

  const statusCode = err.statusCode || (err.name === 'UnauthorizedError' ? 401 : 500);

  res.status(statusCode).json({
    success: false,
    error:
      statusCode === 500 && env.NODE_ENV === 'production'
        ? 'An unexpected server error occurred. Please contact support.'
        : err.message || 'Internal server error',
  });
};
