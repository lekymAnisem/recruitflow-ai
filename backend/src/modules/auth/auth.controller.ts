import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';

const REFRESH_COOKIE = 'refreshToken';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/api/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { user, tokens } = await authService.register(req.body);
    res.cookie(REFRESH_COOKIE, tokens.refreshToken, COOKIE_OPTIONS);
    res.status(201).json({
      success: true,
      data: { user, accessToken: tokens.accessToken },
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    const { user, tokens } = await authService.login(email, password);
    res.cookie(REFRESH_COOKIE, tokens.refreshToken, COOKIE_OPTIONS);
    res.status(200).json({
      success: true,
      data: { user, accessToken: tokens.accessToken },
    });
  } catch (error) {
    next(error);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const refreshToken = req.cookies?.[REFRESH_COOKIE] || req.body.refreshToken;
    if (!refreshToken) {
      res.status(400).json({ success: false, message: 'Refresh token required' });
      return;
    }
    const { accessToken, refreshToken: newRefreshToken } =
      await authService.refreshAccessToken(refreshToken);
    res.cookie(REFRESH_COOKIE, newRefreshToken, COOKIE_OPTIONS);
    res.status(200).json({
      success: true,
      data: { accessToken },
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];
    if (refreshToken) {
      await authService.logout(refreshToken);
    }
    res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
}

export async function registerCandidate(req: Request, res: Response, next: NextFunction) {
  try {
    const { user, tokens } = await authService.registerCandidate(req.body);
    res.cookie(REFRESH_COOKIE, tokens.refreshToken, COOKIE_OPTIONS);
    res.status(201).json({
      success: true,
      data: { user, accessToken: tokens.accessToken },
    });
  } catch (error) {
    next(error);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await authService.getCurrentUser(req.user!.userId);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}
