import { Request, Response, NextFunction } from 'express';
import { Client } from './client.model';
import { assertOwnership } from '../../utils/ownershipCheck';

export const createClient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const client = await Client.create({
      ...req.body,
      userId: req.user?._id,
    });

    res.status(201).json({
      success: true,
      data: client,
    });
  } catch (error) {
    next(error);
  }
};

export const getClients = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const query: any = { userId: req.user?._id, isDeleted: false };
    
    if (req.query.search) {
      query.$text = { $search: req.query.search as string };
    }

    const total = await Client.countDocuments(query);
    const clients = await Client.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: clients,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getClientById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const client = await assertOwnership(Client, req.params.id as string, req.user?._id as string);
    
    if (client.isDeleted) {
      const err = new Error('Client not found') as any;
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    res.status(200).json({
      success: true,
      data: client,
    });
  } catch (error) {
    next(error);
  }
};

export const updateClient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const client = await assertOwnership(Client, req.params.id as string, req.user?._id as string);

    if (client.isDeleted) {
      const err = new Error('Client not found') as any;
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    Object.assign(client, req.body);
    await client.save();

    res.status(200).json({
      success: true,
      data: client,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteClient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const client = await assertOwnership(Client, req.params.id as string, req.user?._id as string);

    // Soft delete
    client.isDeleted = true;
    client.deletedAt = new Date();
    await client.save();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};
