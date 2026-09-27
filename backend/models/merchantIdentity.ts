import mongoose, { Document, Schema } from "mongoose";

export interface IMerchantMember extends Document {
  merchantId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: "owner" | "admin" | "manager" | "staff";
  permissions: string[];
  status: "invited" | "active" | "suspended";
  invitedBy?: mongoose.Types.ObjectId;
  joinedAt?: Date;
}

const merchantMemberSchema = new Schema<IMerchantMember>(
  {
    merchantId: { type: Schema.Types.ObjectId, ref: "Merchant", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: {
      type: String,
      enum: ["owner", "admin", "manager", "staff"],
      required: true,
    },
    permissions: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["invited", "active", "suspended"],
      default: "invited",
    },
    invitedBy: { type: Schema.Types.ObjectId, ref: "User" },
    joinedAt: Date,
  },
  { timestamps: true }
);

merchantMemberSchema.index({ merchantId: 1, userId: 1 }, { unique: true });
merchantMemberSchema.index({ merchantId: 1, role: 1, status: 1 });

export interface ICustomer extends Document {
  merchantId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  customerCode: string;
  type: "individual" | "business";
  name: string;
  email?: string;
  phone?: string;
  status: "pending" | "active" | "blocked";
  channelIds: mongoose.Types.ObjectId[];
  customerGroupIds: mongoose.Types.ObjectId[];
  reseller: { requested: boolean; approved: boolean; approvedAt?: Date; approvedBy?: mongoose.Types.ObjectId };
}

const customerSchema = new Schema<ICustomer>(
  {
    merchantId: { type: Schema.Types.ObjectId, ref: "Merchant", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    customerCode: { type: String, required: true, trim: true, uppercase: true },
    type: { type: String, enum: ["individual", "business"], default: "individual" },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    status: { type: String, enum: ["pending", "active", "blocked"], default: "active" },
    channelIds: [{ type: Schema.Types.ObjectId, ref: "Channel" }],
    customerGroupIds: [{ type: Schema.Types.ObjectId, ref: "CustomerGroup" }],
    reseller: {
      requested: { type: Boolean, default: false },
      approved: { type: Boolean, default: false },
      approvedAt: Date,
      approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    },
  },
  { timestamps: true }
);

customerSchema.index({ merchantId: 1, customerCode: 1 }, { unique: true });
customerSchema.index({ merchantId: 1, userId: 1 }, { unique: true, sparse: true });
customerSchema.index({ merchantId: 1, email: 1 });

export const MerchantMember =
  mongoose.models.MerchantMember ||
  mongoose.model<IMerchantMember>("MerchantMember", merchantMemberSchema);

export const Customer =
  mongoose.models.Customer || mongoose.model<ICustomer>("Customer", customerSchema);
