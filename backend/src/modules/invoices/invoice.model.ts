import mongoose, { Document, Model } from 'mongoose';

export interface ILineItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface IInvoice extends Document {
  userId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  invoiceNumber: string;
  date: Date;
  dueDate: Date;
  lineItems: ILineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  notes?: string;
  terms?: string;
  isDeleted: boolean;
  deletedAt?: Date;
}

const lineItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  rate: { type: Number, required: true, min: 0 },
  amount: { type: Number, required: true, min: 0 },
});

const invoiceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
    },
    invoiceNumber: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    lineItems: [lineItemSchema],
    subtotal: {
      type: Number,
      required: true,
      default: 0,
    },
    taxRate: {
      type: Number,
      default: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
      default: 0,
    },
    status: {
      type: String,
      enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
      default: 'draft',
    },
    notes: {
      type: String,
    },
    terms: {
      type: String,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
invoiceSchema.index({ userId: 1, clientId: 1 });
invoiceSchema.index({ invoiceNumber: 1 });
invoiceSchema.index({ status: 1 });

export const Invoice: Model<IInvoice> = mongoose.model<IInvoice>('Invoice', invoiceSchema);
