import { Request, Response, NextFunction } from 'express';
import { MulterError } from 'multer';
import { AppError } from '../lib/AppError';
import { config } from '../config';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  let statusCode = 500;
  let message = 'Internal Server Error';

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof MulterError) {
    statusCode = 400;
    message = err.message;
  } else if (err instanceof SyntaxError && 'body' in err) {
    statusCode = 400;
    message = 'Invalid JSON in request body';
  }

  if (config.nodeEnv === 'development') {
    console.error('Error:', err);
  }

  const response: Record<string, unknown> = {
    success: false,
    message,
  };

  if (config.nodeEnv === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}
