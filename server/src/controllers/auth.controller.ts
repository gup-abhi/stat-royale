import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as authService from '../services/auth.service';
import { ValidationError } from '../utils/supercell-errors';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

const logoutSchema = z.object({
  refreshToken: z.string().min(1),
});

export const authController = {
  register: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = registerSchema.safeParse(req.body);
      if (!result.success) {
        throw new ValidationError(result.error.issues[0]?.message ?? 'Invalid input');
      }
      const tokens = await authService.register(result.data.email, result.data.password);
      res.status(201).json({ success: true, data: tokens });
    } catch (err) {
      next(err);
    }
  },

  login: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = loginSchema.safeParse(req.body);
      if (!result.success) {
        throw new ValidationError(result.error.issues[0]?.message ?? 'Invalid input');
      }
      const tokens = await authService.login(result.data.email, result.data.password);
      res.json({ success: true, data: tokens });
    } catch (err) {
      next(err);
    }
  },

  logout: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = logoutSchema.safeParse(req.body);
      if (!result.success) {
        throw new ValidationError(result.error.issues[0]?.message ?? 'Invalid input');
      }
      await authService.logout(result.data.refreshToken);
      res.json({ success: true, data: null });
    } catch (err) {
      next(err);
    }
  },

  refresh: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = refreshSchema.safeParse(req.body);
      if (!result.success) {
        throw new ValidationError(result.error.issues[0]?.message ?? 'Invalid input');
      }
      const tokens = await authService.refresh(result.data.refreshToken);
      res.json({ success: true, data: tokens });
    } catch (err) {
      next(err);
    }
  },

  me: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await authService.getMe((req as Request & { user: { id: string } }).user.id);
      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  },
};
