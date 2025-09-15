import { z } from 'zod';

export const UserRole = z.enum(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']);
export type UserRole = z.infer<typeof UserRole>;

export interface JWTPayload {
  userId: string;
  email: string;
  organizationId: string;
  role: UserRole;
}

export interface AuthenticatedRequest {
  user: JWTPayload;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  organizationId: string;
  role: UserRole;
}

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain uppercase, lowercase, number and special character'
  ),
  name: z.string().min(2).max(100),
  organizationName: z.string().min(2).max(100),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string(),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;