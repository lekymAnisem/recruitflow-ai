import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AppError } from '../lib/AppError';

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  organizationId: string;
}

export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token && req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    throw new AppError('Authentication required. No token provided.', 401);
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret, {
      issuer: config.jwtIssuer,
    }) as JwtPayload;

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      organizationId: decoded.organizationId,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError('Token has expired.', 401);
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError('Invalid token.', 401);
    }
    throw error;
  }
}

export function optionalAuthenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token && req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret, {
      issuer: config.jwtIssuer,
    }) as JwtPayload;

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      organizationId: decoded.organizationId,
    };
  } catch {
    // Invalid/expired token — proceed as unauthenticated
  }

  next();
}

export function authorize(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError('Authentication required.', 401);
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError(
        `Role '${req.user.role}' is not authorized to access this resource.`,
        403,
      );
    }

    next();
  };
}
