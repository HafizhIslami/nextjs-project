import mongoose, { Document, Schema } from "mongoose";

export type MerchantStatus = "draft" | "active" | "suspended" | "archived";

export interface IMerchant extends Document {
  merchantCode: string;
  name: string;
  legalName?: string;
  status: MerchantStatus;
  businessType?: string;
  branding: {
    logoUrl?: string;
    faviconUrl?: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    fontFamily?: string;
  };
  settings: {
    currency: string;
    locale: string;
    timezone: string;
    taxEnabled: boolean;
    pricesIncludeTax: boolean;
    guestCheckoutEnabled: boolean;
  };
  enabledModules: string[];
  provisioningKey?: string;
  createdByPlatformUserId?: mongoose.Types.ObjectId;
  suspendedAt?: Date;
  suspensionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const merchantSchema = new Schema<IMerchant>(
  {
    merchantCode: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/,
    },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    legalName: { type: String, trim: true, maxlength: 180 },
    status: {
      type: String,
      enum: ["draft", "active", "suspended", "archived"],
      default: "draft",
      index: true,
    },
    businessType: { type: String, trim: true, maxlength: 80 },
    branding: {
      logoUrl: String,
      faviconUrl: String,
      primaryColor: { type: String, default: "#a7194b" },
      secondaryColor: { type: String, default: "#23191f" },
      accentColor: { type: String, default: "#f6dce6" },
      fontFamily: String,
    },
    settings: {
      currency: { type: String, default: "IDR", uppercase: true },
      locale: { type: String, default: "id-ID" },
      timezone: { type: String, default: "Asia/Jakarta" },
      taxEnabled: { type: Boolean, default: false },
      pricesIncludeTax: { type: Boolean, default: true },
      guestCheckoutEnabled: { type: Boolean, default: true },
    },
    enabledModules: {
      type: [String],
      default: ["catalog", "commerce", "rental"],
    },
    provisioningKey: { type: String, unique: true, sparse: true, select: false },
    createdByPlatformUserId: { type: Schema.Types.ObjectId, ref: "User" },
    suspendedAt: Date,
    suspensionReason: { type: String, maxlength: 500 },
  },
  { timestamps: true }
);

export interface IMerchantDomain extends Document {
  merchantId: mongoose.Types.ObjectId;
  hostname: string;
  type: "platform_subdomain" | "custom_domain";
  isPrimary: boolean;
  status: "pending" | "verifying" | "active" | "failed" | "disabled";
  verification?: {
    method?: "dns_txt" | "cname";
    tokenHash?: string;
    verifiedAt?: Date;
  };
  sslStatus: "pending" | "active" | "failed";
  createdAt: Date;
  updatedAt: Date;
}

const merchantDomainSchema = new Schema<IMerchantDomain>(
  {
    merchantId: {
      type: Schema.Types.ObjectId,
      ref: "Merchant",
      required: true,
      index: true,
    },
    hostname: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["platform_subdomain", "custom_domain"],
      required: true,
    },
    isPrimary: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["pending", "verifying", "active", "failed", "disabled"],
      default: "pending",
      index: true,
    },
    verification: {
      method: { type: String, enum: ["dns_txt", "cname"] },
      tokenHash: { type: String, select: false },
      verifiedAt: Date,
    },
    sslStatus: {
      type: String,
      enum: ["pending", "active", "failed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

merchantDomainSchema.index({ merchantId: 1, isPrimary: 1 });
merchantDomainSchema.index({ merchantId: 1, status: 1 });

export const Merchant =
  mongoose.models.Merchant || mongoose.model<IMerchant>("Merchant", merchantSchema);

export const MerchantDomain =
  mongoose.models.MerchantDomain ||
  mongoose.model<IMerchantDomain>("MerchantDomain", merchantDomainSchema);

export default Merchant;
