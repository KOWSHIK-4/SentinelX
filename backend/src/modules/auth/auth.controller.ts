import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthService } from './auth.service';
import { AuthRequest } from '../../types';
import { ApiResponse } from '../../types';

const authService = new AuthService();

export const registerSchema = z.object({
  email: z.string().email('Please provide a valid email address.'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long.')
    .max(128, 'Password must not exceed 128 characters.'),
  firstName: z.string().min(1, 'First name is required.').max(100),
  lastName: z.string().min(1, 'Last name is required.').max(100),
});

export const loginSchema = z.object({
  email: z.string().email('Please provide a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

export async function register(req: AuthRequest, res: Response<ApiResponse>, next: NextFunction) {
  try {
    const { email, password, firstName, lastName } = req.body;
    const result = await authService.register(email, password, firstName, lastName);

    res.status(201).json({
      success: true,
      data: result,
      message: 'Account created successfully.',
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req: AuthRequest, res: Response<ApiResponse>, next: NextFunction) {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);

    res.json({
      success: true,
      data: result,
      message: 'Login successful.',
    });
  } catch (error) {
    next(error);
  }
}

export async function getProfile(req: AuthRequest, res: Response<ApiResponse>, next: NextFunction) {
  try {
    const user = await authService.getProfile(req.user!.userId);

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}
