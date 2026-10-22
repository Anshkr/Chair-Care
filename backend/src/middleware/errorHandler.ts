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

  const rawMsg = err.message || '';
  const isTechnical =
    statusCode >= 500 ||
    /sql|syntax|postgres|relation|column|parameter|table|database|typeerror|referenceerror|econnrefused|fetch|failed with status/i.test(rawMsg);

  res.status(statusCode).json({
    success: false,
    error: isTechnical
      ? 'Unable to complete this request right now. Please try again shortly.'
      : rawMsg || 'Request could not be processed.',
  });
};
