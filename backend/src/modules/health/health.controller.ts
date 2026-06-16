import { Request, Response } from 'express';
import mongoose from 'mongoose';

/**
 * @desc    Basic server health check
 * @route   GET /api/health
 * @access  Public
 */
export const checkHealth = (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Server is up and running',
    timestamp: new Date().toISOString()
  });
};

/**
 * @desc    Database connection status check
 * @route   GET /api/health/ready
 * @access  Public
 */
export const checkReady = (req: Request, res: Response) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  
  if (isDbConnected) {
    res.status(200).json({
      success: true,
      message: 'Database is connected and ready',
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(503).json({
      success: false,
      message: 'Database is not connected',
      timestamp: new Date().toISOString()
    });
  }
};
