import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

export interface Context {
  prisma: PrismaClient;
  userId?: string;
}

export interface TokenPayload {
  userId: string;
}

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

export function getUserIdFromToken(token?: string): string | undefined {
  if (!token) return undefined;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    return decoded.userId;
  } catch (error) {
    return undefined;
  }
}

export function createToken(userId: string): string {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}
