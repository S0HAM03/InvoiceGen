import { Request, Response, NextFunction } from 'express';
import { Invoice, ILineItem } from './invoice.model';
import { assertOwnership } from '../../utils/ownershipCheck';
import { Client } from '../clients/client.model';

const calculateTotals = (lineItems: any[], taxRate: number = 0) => {
  const processedItems = lineItems.map((item: any) => ({
    ...item,
    amount: item.quantity * item.rate,
  }));

  const subtotal = processedItems.reduce((acc: number, item: any) => acc + item.amount, 0);
  const taxAmount = (subtotal * taxRate) / 100;
  const total = subtotal + taxAmount;

  return { processedItems, subtotal, taxAmount, total };
};

export const createInvoice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { clientId, lineItems, taxRate = 0, ...rest } = req.body;

    // Verify client belongs to user
    await assertOwnership(Client, clientId, req.user?._id as string);

    const { processedItems, subtotal, taxAmount, total } = calculateTotals(lineItems, taxRate);

    const invoice = await Invoice.create({
      ...rest,
      userId: req.user?._id,
      clientId,
      lineItems: processedItems,
      subtotal,
      taxRate,
      taxAmount,
      total,
    });

    res.status(201).json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
};

export const getInvoices = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const query: any = { userId: req.user?._id, isDeleted: false };
    
    if (req.query.status) {
      query.status = req.query.status;
    }
    if (req.query.clientId) {
      query.clientId = req.query.clientId;
    }

    const total = await Invoice.countDocuments(query);
    const invoices = await Invoice.find(query)
      .populate('clientId', 'name email company')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: invoices,
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

export const getInvoiceById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoice = await assertOwnership(Invoice, req.params.id as string, req.user?._id as string);
    
    if (invoice.isDeleted) {
      const err = new Error('Invoice not found') as any;
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    await invoice.populate('clientId', 'name email address phone company');

    res.status(200).json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
};

export const updateInvoice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoice = await assertOwnership(Invoice, req.params.id as string, req.user?._id as string);

    if (invoice.isDeleted) {
      const err = new Error('Invoice not found') as any;
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    // If client is being updated, verify it belongs to user
    if (req.body.clientId && req.body.clientId !== invoice.clientId.toString()) {
      await assertOwnership(Client, req.body.clientId, req.user?._id as string);
    }

    // Recalculate totals if lineItems or taxRate is provided
    let updateData = { ...req.body };
    if (req.body.lineItems || req.body.taxRate !== undefined) {
      const itemsToUse = req.body.lineItems || invoice.lineItems;
      const taxRateToUse = req.body.taxRate !== undefined ? req.body.taxRate : invoice.taxRate;
      
      const { processedItems, subtotal, taxAmount, total } = calculateTotals(itemsToUse, taxRateToUse);
      
      updateData.lineItems = processedItems;
      updateData.subtotal = subtotal;
      updateData.taxAmount = taxAmount;
      updateData.total = total;
      updateData.taxRate = taxRateToUse;
    }

    Object.assign(invoice, updateData);
    await invoice.save();

    res.status(200).json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteInvoice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoice = await assertOwnership(Invoice, req.params.id as string, req.user?._id as string);

    // Soft delete
    invoice.isDeleted = true;
    invoice.deletedAt = new Date();
    await invoice.save();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};
