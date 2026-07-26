import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import * as Sentry from '@sentry/node';
import { env } from '../config/env';
import { ApiResponse } from '../types';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

function isPrismaError(err: unknown): err is Prisma.PrismaClientKnownRequestError {
  return err instanceof Prisma.PrismaClientKnownRequestError;
}

function handlePrismaError(err: Prisma.PrismaClientKnownRequestError): { statusCode: number; message: string } {
  switch (err.code) {
    case 'P2002':
      return { statusCode: 409, message: 'A record with this value already exists.' };
    case 'P2025':
      return { statusCode: 404, message: 'Record not found.' };
    case 'P2003':
      return { statusCode: 400, message: 'Referenced record does not exist.' };
    default:
      return { statusCode: 500, message: 'Database error occurred.' };
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response<ApiResponse>,
  _next: NextFunction,
): void {
  if (env.SENTRY_DSN) {
    Sentry.captureException(err);
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      message: err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
    });
    return;
  }

  if (isPrismaError(err)) {
    const { statusCode, message } = handlePrismaError(err);
    res.status(statusCode).json({
      success: false,
      error: message,
    });
    return;
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token.',
    });
    return;
  }

  if (env.NODE_ENV === 'development') {
    console.error('Unhandled error:', {
      name: err.name,
      message: err.message,
      stack: err.stack,
    });
  } else {
    console.error('Unhandled error:', err.name);
  }

  res.status(500).json({
    success: false,
    error: 'An unexpected error occurred. Please try again later.',
  });
}
