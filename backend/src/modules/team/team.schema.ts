import { z } from 'zod';

export const createTeamMemberSchema = z.object({
  email: z.string().email('Invalid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  firstName: z.string().min(1, 'First name is required.').max(100),
  lastName: z.string().min(1, 'Last name is required.').max(100),
  roleName: z.enum(['Admin', 'Analyst', 'Viewer']),
});

export const updateTeamMemberSchema = z.object({
  email: z.string().email('Invalid email address.').optional(),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  roleName: z.enum(['Admin', 'Analyst', 'Viewer']).optional(),
  isActive: z.boolean().optional(),
});
