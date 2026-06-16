import { Request, Response, NextFunction } from 'express';
import { User } from './user.model';
import { Session } from '../auth/session.model';

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user?._id);

    if (!user) {
      const err = new Error('User not found') as any;
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        businessLogo: user.businessLogo,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, avatar, businessLogo } = req.body;
    const user = await User.findById(req.user?._id);

    if (!user) {
      const err = new Error('User not found') as any;
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    if (name) user.name = name;
    if (avatar !== undefined) user.avatar = avatar;
    if (businessLogo !== undefined) user.businessLogo = businessLogo;

    await user.save();

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        businessLogo: user.businessLogo,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user?._id).select('+password');

    if (!user) {
      const err = new Error('User not found') as any;
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    if (!(await user.matchPassword(currentPassword))) {
      const err = new Error('Incorrect current password') as any;
      err.statusCode = 400;
      err.code = 'BAD_REQUEST';
      throw err;
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const getSessions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessions = await Session.find({ user: req.user?._id, isValid: true })
      .select('userAgent ipAddress createdAt expiresAt')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    next(error);
  }
};

export const revokeSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const session = await Session.findOne({ _id: id, user: req.user?._id });

    if (!session) {
      const err = new Error('Session not found') as any;
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    session.isValid = false;
    await session.save();

    res.status(200).json({ success: true, message: 'Session revoked successfully' });
  } catch (error) {
    next(error);
  }
};
