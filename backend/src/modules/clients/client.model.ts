import mongoose, { Document, Model } from 'mongoose';

export interface IClient extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  company?: string;
  isDeleted: boolean;
  deletedAt?: Date;
}

const clientSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      lowercase: true,
    },
    phone: {
      type: String,
    },
    address: {
      type: String,
    },
    company: {
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

// Indexes to speed up queries by user and enable search
clientSchema.index({ userId: 1 });
clientSchema.index({ name: 'text', email: 'text', company: 'text' });

export const Client: Model<IClient> = mongoose.model<IClient>('Client', clientSchema);
