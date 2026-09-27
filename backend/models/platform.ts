import mongoose, { Document, Schema } from "mongoose";

export type PlatformRole = "owner" | "admin" | "support";

export interface IPlatformMember extends Document {
  userId: mongoose.Types.ObjectId;
  role: PlatformRole;
  status: "active" | "suspended";
  permissions: string[];
  mfaRequired: boolean;
  createdBy?: mongoose.Types.ObjectId;
  lastAccessAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const platformMemberSchema = new Schema<IPlatformMember>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    role: {
      type: String,
      enum: ["owner", "admin", "support"],
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "suspended"],
      default: "active",
      index: true,
    },
    permissions: { type: [String], default: [] },
    mfaRequired: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    lastAccessAt: Date,
  },
  { timestamps: true }
);
platformMemberSchema.index({ role: 1, status: 1 });

export interface IPlatformAuditLog extends Document {
  actorUserId?: mongoose.Types.ObjectId;
  actorRole?: PlatformRole | "system";
  action: string;
  targetType: string;
  targetId?: mongoose.Types.ObjectId;
  merchantId?: mongoose.Types.ObjectId;
  changes?: Record<string, unknown>;
  request?: { requestId?: string; ip?: string; userAgent?: string };
  createdAt: Date;
}

const platformAuditLogSchema = new Schema<IPlatformAuditLog>(
  {
    actorUserId: { type: Schema.Types.ObjectId, ref: "User" },
    actorRole: {
      type: String,
      enum: ["owner", "admin", "support", "system"],
    },
    action: { type: String, required: true, trim: true, maxlength: 120 },
    targetType: { type: String, required: true, trim: true, maxlength: 80 },
    targetId: Schema.Types.ObjectId,
    merchantId: { type: Schema.Types.ObjectId, ref: "Merchant", index: true },
    changes: Schema.Types.Mixed,
    request: {
      requestId: String,
      ip: String,
      userAgent: String,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
platformAuditLogSchema.index({ createdAt: -1 });
platformAuditLogSchema.index({ actorUserId: 1, createdAt: -1 });
platformAuditLogSchema.index({ merchantId: 1, createdAt: -1 });

export const PlatformMember =
  mongoose.models.PlatformMember ||
  mongoose.model<IPlatformMember>("PlatformMember", platformMemberSchema);

export const PlatformAuditLog =
  mongoose.models.PlatformAuditLog ||
  mongoose.model<IPlatformAuditLog>("PlatformAuditLog", platformAuditLogSchema);

