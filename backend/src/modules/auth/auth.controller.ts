import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { User } from '../users/user.model';
import { Session } from './session.model';
import { signAccess, signRefresh } from '../../utils/jwt';
import { env } from '../../config/env';

const createSession = async (userId: string, req: Request) => {
  const refreshTokenPlain = signRefresh(userId);
  const salt = await bcrypt.genSalt(10);
  const refreshTokenHashed = await bcrypt.hash(refreshTokenPlain, salt);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  await Session.create({
    user: userId,
    refreshToken: refreshTokenHashed,
    userAgent: req.headers['user-agent'] || '',
    ipAddress: req.ip || req.connection.remoteAddress || '',
    expiresAt,
  });

  return refreshTokenPlain;
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
      const err = new Error('User already exists') as any;
      err.statusCode = 409;
      err.code = 'CONFLICT';
      throw err;
    }

    const user = await User.create({
      name,
      email,
      password,
    });

    const accessToken = signAccess(user._id.toString(), user.role);
    const refreshTokenPlain = await createSession(user._id.toString(), req);

    res.cookie('jwt', refreshTokenPlain, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email, isDeleted: false }).select('+password');

    if (user && (await user.matchPassword(password))) {
      const accessToken = signAccess(user._id.toString(), user.role);
      const refreshTokenPlain = await createSession(user._id.toString(), req);

      res.cookie('jwt', refreshTokenPlain, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(200).json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          accessToken,
        },
      });
    } else {
      const err = new Error('Invalid email or password') as any;
      err.statusCode = 401;
      err.code = 'UNAUTHORIZED';
      throw err;
    }
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.cookies?.jwt;

    if (!refreshToken) {
      const err = new Error('Not authorized, no refresh token') as any;
      err.statusCode = 401;
      err.code = 'UNAUTHORIZED';
      throw err;
    }

    const decoded = require('jsonwebtoken').verify(refreshToken, env.JWT_REFRESH_SECRET) as any;
    
    // Find sessions for this user
    const sessions = await Session.find({ user: decoded.id, isValid: true, expiresAt: { $gt: new Date() } });
    
    let matchedSession = null;
    for (const session of sessions) {
      const isValid = await bcrypt.compare(refreshToken, session.refreshToken);
      if (isValid) {
        matchedSession = session;
        break;
      }
    }

    if (!matchedSession) {
      throw new Error('Invalid refresh token');
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      throw new Error('User not found');
    }

    const accessToken = signAccess(user._id.toString(), user.role);
    
    // Rotate refresh token
    const newRefreshTokenPlain = signRefresh(user._id.toString());
    const salt = await bcrypt.genSalt(10);
    matchedSession.refreshToken = await bcrypt.hash(newRefreshTokenPlain, salt);
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    matchedSession.expiresAt = expiresAt;
    matchedSession.ipAddress = req.ip || req.connection.remoteAddress || '';
    matchedSession.userAgent = req.headers['user-agent'] || '';
    await matchedSession.save();

    res.cookie('jwt', newRefreshTokenPlain, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      success: true,
      data: {
        accessToken,
      },
    });

  } catch (error) {
    res.clearCookie('jwt');
    const err = new Error('Invalid refresh token') as any;
    err.statusCode = 401;
    err.code = 'REFRESH_TOKEN_INVALID';
    next(err);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.cookies?.jwt;
    if (refreshToken) {
      try {
        const decoded = require('jsonwebtoken').verify(refreshToken, env.JWT_REFRESH_SECRET) as any;
        const sessions = await Session.find({ user: decoded.id, isValid: true });
        
        for (const session of sessions) {
          const isValid = await bcrypt.compare(refreshToken, session.refreshToken);
          if (isValid) {
            session.isValid = false;
            await session.save();
            break;
          }
        }
      } catch (e) {
        // ignore invalid token on logout
      }
    }

    res.cookie('jwt', '', {
      httpOnly: true,
      expires: new Date(0),
    });

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

export const logoutAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Assuming requireAuth middleware adds req.user
    const userId = (req as any).user._id;
    await Session.updateMany({ user: userId }, { isValid: false });

    res.cookie('jwt', '', {
      httpOnly: true,
      expires: new Date(0),
    });

    res.status(200).json({ success: true, message: 'Logged out of all sessions' });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      // Return 200 to avoid email enumeration
      return res.status(200).json({ success: true, message: 'If email exists, reset link sent.' });
    }

    // In a real app, generate a reset token, save hashed version to DB, and send email.
    // We mock this behavior here.
    const resetToken = crypto.randomBytes(20).toString('hex');
    
    // Normally: user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    // user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    // await user.save();
    // await sendEmail({ to: user.email, text: `Token: ${resetToken}` });

    res.status(200).json({ success: true, message: 'If email exists, reset link sent. (MOCK)' });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, password } = req.body;

    // In a real app, find user by hashed token and ensure token is not expired.
    // For this mock, we just return success.
    res.status(200).json({ success: true, message: 'Password reset successful (MOCK)' });
  } catch (error) {
    next(error);
  }
};
