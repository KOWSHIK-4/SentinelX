import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { ApiResponse, AuthRequest } from '../types';

type ValidateSource = 'body' | 'query';

export function validate(schema: ZodSchema, source: ValidateSource = 'body') {
  return (req: Request, res: Response<ApiResponse>, next: NextFunction): void => {
    const data = source === 'body' ? req.body : req.query;
    const result = schema.safeParse(data);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      });
      return;
    }

    if (source === 'body') {
      req.body = result.data;
    } else {
      (req as AuthRequest).validatedQuery = result.data as Record<string, unknown>;
    }
    next();
  };
}
