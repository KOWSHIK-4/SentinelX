import { Request } from 'express';

export interface JwtPayload {
  userId: string;
  email: string;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
  validatedQuery?: Record<string, unknown>;
}

export interface RoleInfo {
  id: string;
  name: string;
}

export interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles?: RoleInfo[];
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AuthResponse {
  user: UserResponse;
  token: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
