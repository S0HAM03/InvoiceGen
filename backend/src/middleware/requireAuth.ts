import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as { id: string, role?: string };

      // We attach the user ID and role to the request
      // (The actual user object can be fetched from DB in specific controllers if needed, 
      // but usually the ID is enough for ownership checks)
      req.user = {
        _id: decoded.id,
        role: decoded.role
      };

      next();
    } catch (error) {
      next(error);
    }
  } else {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Not authorized, no token'
      }
    });
  }
};
