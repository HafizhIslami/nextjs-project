import mongoose, { Document, Schema } from "mongoose";

const merchantRef = { type: Schema.Types.ObjectId, ref: "Merchant", required: true } as const;

const inventoryResourceSchema = new Schema(
  {
    merchantId: merchantRef,
    offeringId: { type: Schema.Types.ObjectId, ref: "Offering", required: true },
    variantId: Schema.Types.ObjectId,
    code: { type: String, required: true, trim: true, uppercase: true },
    name: String,
    type: { type: String, enum: ["stock", "asset", "capacity"], required: true },
    status: { type: String, enum: ["active", "maintenance", "inactive"], default: "active" },
    stock: {
      onHand: { type: Number, default: 0, min: 0 },
      reserved: { type: Number, default: 0, min: 0 },
    },
    capacity: { total: { type: Number, min: 0 } },
    metadata: Schema.Types.Mixed,
  },
  { timestamps: true }
);
inventoryResourceSchema.index({ merchantId: 1, code: 1 }, { unique: true });
inventoryResourceSchema.index({ merchantId: 1, offeringId: 1 });

const inventoryMovementSchema = new Schema(
  {
    merchantId: merchantRef,
    inventoryResourceId: { type: Schema.Types.ObjectId, ref: "InventoryResource", required: true },
    type: {
      type: String,
      enum: ["initial", "purchase", "adjustment", "reservation", "release", "sale", "return"],
      required: true,
    },
    quantity: { type: Number, required: true },
    referenceType: { type: String, enum: ["order", "reservation", "manual"] },
    referenceId: Schema.Types.ObjectId,
    note: { type: String, maxlength: 500 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
inventoryMovementSchema.index({ merchantId: 1, inventoryResourceId: 1, createdAt: -1 });
inventoryMovementSchema.index({ merchantId: 1, referenceType: 1, referenceId: 1 });

const cartItemSchema = new Schema(
  {
    offeringId: { type: Schema.Types.ObjectId, ref: "Offering", required: true },
    variantId: Schema.Types.ObjectId,
    quantity: { type: Number, required: true, min: 1 },
    startAt: Date,
    endAt: Date,
    configuration: Schema.Types.Mixed,
  },
  { _id: true }
);

const cartSchema = new Schema(
  {
    merchantId: merchantRef,
    channelId: { type: Schema.Types.ObjectId, ref: "Channel", required: true },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer" },
    sessionId: String,
    status: { type: String, enum: ["active", "converted", "abandoned", "expired"], default: "active" },
    currency: { type: String, default: "IDR", uppercase: true },
    items: { type: [cartItemSchema], default: [] },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);
cartSchema.index({ merchantId: 1, customerId: 1, status: 1 });
cartSchema.index({ merchantId: 1, sessionId: 1, status: 1 });
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const orderItemSchema = new Schema(
  {
    offeringId: { type: Schema.Types.ObjectId, ref: "Offering", required: true },
    variantId: Schema.Types.ObjectId,
    offeringType: { type: String, enum: ["physical", "service", "rental", "custom"], required: true },
    codeSnapshot: { type: String, required: true },
    nameSnapshot: { type: String, required: true },
    imageSnapshot: String,
    unitPriceMinor: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    duration: { type: Number, min: 1 },
    durationUnit: String,
    configurationSnapshot: Schema.Types.Mixed,
    subtotalMinor: { type: Number, required: true, min: 0 },
    discountMinor: { type: Number, default: 0, min: 0 },
    taxMinor: { type: Number, default: 0, min: 0 },
    totalMinor: { type: Number, required: true, min: 0 },
  },
  { _id: true }
);

export interface IOrder extends Document {
  merchantId: mongoose.Types.ObjectId;
  channelId: mongoose.Types.ObjectId;
  customerId?: mongoose.Types.ObjectId;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  customerSnapshot: { name: string; email?: string; phone?: string };
  billingAddressSnapshot?: Record<string, unknown>;
  shippingAddressSnapshot?: Record<string, unknown>;
  items: Array<Record<string, unknown>>;
  totals: { subtotalMinor: number; discountMinor: number; taxMinor: number; shippingMinor: number; grandTotalMinor: number };
  currency: string;
  notes?: string;
  placedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    merchantId: merchantRef,
    channelId: { type: Schema.Types.ObjectId, ref: "Channel", required: true },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer" },
    orderNumber: { type: String, required: true },
    status: {
      type: String,
      enum: ["draft", "pending", "confirmed", "processing", "completed", "cancelled"],
      default: "draft",
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "pending", "paid", "partially_refunded", "refunded", "failed"],
      default: "unpaid",
    },
    fulfillmentStatus: {
      type: String,
      enum: ["unfulfilled", "reserved", "processing", "fulfilled", "cancelled"],
      default: "unfulfilled",
    },
    customerSnapshot: {
      name: { type: String, required: true },
      email: String,
      phone: String,
    },
    billingAddressSnapshot: Schema.Types.Mixed,
    shippingAddressSnapshot: Schema.Types.Mixed,
    items: { type: [orderItemSchema], validate: [(value: unknown[]) => value.length > 0, "Order requires at least one item"] },
    totals: {
      subtotalMinor: { type: Number, required: true, min: 0 },
      discountMinor: { type: Number, default: 0, min: 0 },
      taxMinor: { type: Number, default: 0, min: 0 },
      shippingMinor: { type: Number, default: 0, min: 0 },
      grandTotalMinor: { type: Number, required: true, min: 0 },
    },
    currency: { type: String, required: true, uppercase: true },
    notes: { type: String, maxlength: 2000 },
    placedAt: Date,
    completedAt: Date,
    cancelledAt: Date,
  },
  { timestamps: true }
);
orderSchema.index({ merchantId: 1, orderNumber: 1 }, { unique: true });
orderSchema.index({ merchantId: 1, customerId: 1, createdAt: -1 });
orderSchema.index({ merchantId: 1, status: 1, createdAt: -1 });
orderSchema.index({ merchantId: 1, channelId: 1, createdAt: -1 });

const paymentSchema = new Schema(
  {
    merchantId: merchantRef,
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    provider: { type: String, enum: ["stripe", "manual", "bank_transfer", "cash"], required: true },
    providerPaymentId: String,
    providerSessionId: String,
    idempotencyKey: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "authorized", "paid", "failed", "cancelled", "refunded"],
      default: "pending",
    },
    amountMinor: { type: Number, required: true, min: 0 },
    refundedAmountMinor: { type: Number, default: 0, min: 0 },
    currency: { type: String, required: true, uppercase: true },
    metadata: Schema.Types.Mixed,
    paidAt: Date,
    failedAt: Date,
  },
  { timestamps: true }
);
paymentSchema.index({ merchantId: 1, idempotencyKey: 1 }, { unique: true });
paymentSchema.index({ provider: 1, providerPaymentId: 1 }, { unique: true, sparse: true });
paymentSchema.index({ provider: 1, providerSessionId: 1 }, { unique: true, sparse: true });

const reservationSchema = new Schema(
  {
    merchantId: merchantRef,
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    orderItemId: { type: Schema.Types.ObjectId, required: true },
    offeringId: { type: Schema.Types.ObjectId, ref: "Offering", required: true },
    inventoryResourceId: { type: Schema.Types.ObjectId, ref: "InventoryResource", required: true },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer" },
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    quantity: { type: Number, default: 1, min: 1 },
    status: {
      type: String,
      enum: ["held", "confirmed", "checked_in", "completed", "cancelled", "expired"],
      default: "held",
    },
    holdExpiresAt: Date,
  },
  { timestamps: true }
);
reservationSchema.index({ merchantId: 1, inventoryResourceId: 1, startAt: 1, endAt: 1, status: 1 });
reservationSchema.index({ merchantId: 1, orderId: 1 });

const reviewSchema = new Schema(
  {
    merchantId: merchantRef,
    offeringId: { type: Schema.Types.ObjectId, ref: "Offering", required: true },
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, maxlength: 160 },
    comment: { type: String, required: true, maxlength: 3000 },
    status: { type: String, enum: ["pending", "published", "rejected"], default: "pending" },
    verifiedPurchase: { type: Boolean, default: true },
    merchantReply: {
      comment: { type: String, maxlength: 3000 },
      repliedBy: { type: Schema.Types.ObjectId, ref: "User" },
      repliedAt: Date,
    },
  },
  { timestamps: true }
);
reviewSchema.index({ merchantId: 1, orderId: 1, offeringId: 1, customerId: 1 }, { unique: true });
reviewSchema.index({ merchantId: 1, offeringId: 1, status: 1 });

const quotationSchema = new Schema(
  {
    merchantId: merchantRef,
    channelId: { type: Schema.Types.ObjectId, ref: "Channel", required: true },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
    quotationNumber: { type: String, required: true },
    status: {
      type: String,
      enum: ["requested", "reviewing", "offered", "accepted", "rejected", "expired", "converted"],
      default: "requested",
    },
    items: { type: [Schema.Types.Mixed], default: [] },
    totalAmountMinor: { type: Number, min: 0 },
    currency: { type: String, default: "IDR", uppercase: true },
    validUntil: Date,
    convertedOrderId: { type: Schema.Types.ObjectId, ref: "Order" },
  },
  { timestamps: true }
);
quotationSchema.index({ merchantId: 1, quotationNumber: 1 }, { unique: true });

const auditLogSchema = new Schema(
  {
    merchantId: { type: Schema.Types.ObjectId, ref: "Merchant" },
    actor: {
      userId: { type: Schema.Types.ObjectId, ref: "User" },
      type: { type: String, enum: ["user", "system", "webhook"], required: true },
    },
    action: { type: String, required: true },
    target: { type: { type: String, required: true }, id: Schema.Types.ObjectId },
    changes: Schema.Types.Mixed,
    request: { requestId: String, ipHash: String, userAgent: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
auditLogSchema.index({ merchantId: 1, createdAt: -1 });
auditLogSchema.index({ merchantId: 1, "target.type": 1, "target.id": 1 });

export const InventoryResource = mongoose.models.InventoryResource || mongoose.model("InventoryResource", inventoryResourceSchema);
export const InventoryMovement = mongoose.models.InventoryMovement || mongoose.model("InventoryMovement", inventoryMovementSchema);
export const Cart = mongoose.models.Cart || mongoose.model("Cart", cartSchema);
export const Order = mongoose.models.Order || mongoose.model<IOrder>("Order", orderSchema);
export const Payment = mongoose.models.Payment || mongoose.model("Payment", paymentSchema);
export const Reservation = mongoose.models.Reservation || mongoose.model("Reservation", reservationSchema);
export const OfferingReview = mongoose.models.OfferingReview || mongoose.model("OfferingReview", reviewSchema);
export const Quotation = mongoose.models.Quotation || mongoose.model("Quotation", quotationSchema);
export const AuditLog = mongoose.models.AuditLog || mongoose.model("AuditLog", auditLogSchema);
