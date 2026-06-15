import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../users/user.model';
import { signAccess, signRefresh } from '../../utils/jwt';
import { env } from '../../config/env';

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
    const refreshTokenPlain = signRefresh(user._id.toString());

    // Hash refresh token to store in DB
    const salt = await bcrypt.genSalt(10);
    const refreshTokenHashed = await bcrypt.hash(refreshTokenPlain, salt);
    user.refreshToken = refreshTokenHashed;
    await user.save();

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
      const refreshTokenPlain = signRefresh(user._id.toString());

      // Hash refresh token to store in DB
      const salt = await bcrypt.genSalt(10);
      const refreshTokenHashed = await bcrypt.hash(refreshTokenPlain, salt);
      user.refreshToken = refreshTokenHashed;
      await user.save();

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

    // Usually we would verify the token with jsonwebtoken and check it against the DB
    // But for brevity in this generator, if we get here we will clear the cookie and force login if invalid
    // To properly implement the PRD:
    // 1. Verify jwt with JWT_REFRESH_SECRET
    // 2. Find user by decoded ID
    // 3. Compare refreshToken string with bcrypt compared to user.refreshToken

    // Simplified for now - assume token is valid and just generate new access
    // You should expand this to proper bcrypt comparison as per PRD "Refresh token: bcrypt hash in DB"
    const decoded = require('jsonwebtoken').verify(refreshToken, env.JWT_REFRESH_SECRET) as any;
    
    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || !user.refreshToken) {
      throw new Error('Invalid refresh token');
    }

    const isValid = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!isValid) {
      throw new Error('Invalid refresh token');
    }

    const accessToken = signAccess(user._id.toString(), user.role);
    
    // Rotate refresh token
    const newRefreshTokenPlain = signRefresh(user._id.toString());
    const salt = await bcrypt.genSalt(10);
    const refreshTokenHashed = await bcrypt.hash(newRefreshTokenPlain, salt);
    user.refreshToken = refreshTokenHashed;
    await user.save();

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
        const user = await User.findById(decoded.id);
        if (user) {
          user.refreshToken = undefined;
          await user.save();
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
