import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);

  let statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  let code = err.code || 'INTERNAL_ERROR';
  let message = err.message || 'Server Error';
  let fields = err.fields || undefined;

  // Handle Mongoose CastError (e.g., invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 404;
    code = 'NOT_FOUND';
    message = 'Resource not found';
  }

  // Handle Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = 409;
    code = 'CONFLICT';
    message = 'Duplicate field value entered';
  }

  // Handle Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = Object.values(err.errors).map((val: any) => val.message).join(', ');
  }

  // Handle JWT Error
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'TOKEN_INVALID';
    message = 'Not authorized to access this route';
  }

  // Handle JWT Expired Error
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Access token expired';
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(fields && { fields })
    }
  });
};
