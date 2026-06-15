import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export const signAccess = (userId: string, role?: string) => {
  return jwt.sign({ id: userId, role }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as any,
  });
};

export const signRefresh = (userId: string) => {
  return jwt.sign({ id: userId }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as any,
  });
};
