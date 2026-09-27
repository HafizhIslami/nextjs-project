import mongoose, { Document, Schema } from "mongoose";

const tenantRef = { type: Schema.Types.ObjectId, ref: "Merchant", required: true } as const;

const mediaSchema = new Schema(
  {
    type: { type: String, enum: ["image", "video", "document"], default: "image" },
    publicId: String,
    url: { type: String, required: true },
    alt: String,
    sortOrder: { type: Number, default: 0 },
  },
  { _id: false }
);

const offeringAttributeSchema = new Schema(
  {
    code: { type: String, required: true },
    value: { type: Schema.Types.Mixed, required: true },
    unit: String,
  },
  { _id: false }
);

const offeringVariantSchema = new Schema(
  {
    code: { type: String, required: true },
    name: { type: String, required: true },
    attributes: { type: [offeringAttributeSchema], default: [] },
    baseAmountMinor: { type: Number, min: 0 },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { _id: true }
);

const offeringLocationSchema = new Schema(
  {
    type: { type: String, enum: ["Point"], required: true },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: (value: number[]) => value.length === 2 && value.every(Number.isFinite),
        message: "Location requires longitude and latitude",
      },
    },
    formattedAddress: String,
    city: String,
    province: String,
    country: String,
  },
  { _id: false }
);

export interface IChannel extends Document {
  merchantId: mongoose.Types.ObjectId;
  code: string;
  name: string;
  type: "retail" | "reseller" | "internal" | "marketplace";
  status: "active" | "inactive";
  visibility: "public" | "private";
  defaultPriceListId?: mongoose.Types.ObjectId;
  rules: Record<string, unknown>;
}

const channelSchema = new Schema<IChannel>(
  {
    merchantId: tenantRef,
    code: { type: String, required: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ["retail", "reseller", "internal", "marketplace"], required: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    visibility: { type: String, enum: ["public", "private"], default: "public" },
    defaultPriceListId: { type: Schema.Types.ObjectId, ref: "PriceList" },
    rules: {
      requireLogin: { type: Boolean, default: false },
      requireApproval: { type: Boolean, default: false },
      allowGuestCheckout: { type: Boolean, default: true },
      minimumOrderAmountMinor: Number,
      minimumOrderQuantity: Number,
      allowBackorder: { type: Boolean, default: false },
      allowedPaymentMethods: { type: [String], default: ["stripe"] },
    },
  },
  { timestamps: true }
);
channelSchema.index({ merchantId: 1, code: 1 }, { unique: true });

const attributeDefinitionSchema = new Schema(
  {
    code: { type: String, required: true },
    label: { type: String, required: true },
    dataType: { type: String, enum: ["text", "number", "boolean", "select", "multiselect"], required: true },
    unit: String,
    options: [String],
    required: { type: Boolean, default: false },
    filterable: { type: Boolean, default: false },
    searchable: { type: Boolean, default: false },
  },
  { _id: false }
);

const categorySchema = new Schema(
  {
    merchantId: tenantRef,
    parentId: { type: Schema.Types.ObjectId, ref: "Category" },
    code: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true, trim: true },
    description: String,
    attributeDefinitions: { type: [attributeDefinitionSchema], default: [] },
    sortOrder: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);
categorySchema.index({ merchantId: 1, slug: 1 }, { unique: true });

export interface IOffering extends Document {
  merchantId: mongoose.Types.ObjectId;
  categoryId?: mongoose.Types.ObjectId;
  code: string;
  slug: string;
  name: string;
  shortDescription?: string;
  description: string;
  type: "physical" | "service" | "rental" | "custom";
  status: "draft" | "active" | "archived";
  media: Array<{ type: string; publicId?: string; url: string; alt?: string; sortOrder: number }>;
  pricing: { model: string; baseAmountMinor?: number; currency: string; unit?: string; durationUnit?: string };
  inventory: { mode: string; trackInventory: boolean; allowBackorder: boolean };
  attributes: Array<{ code: string; value: unknown; unit?: string }>;
  variants: Array<{
    code: string;
    name: string;
    attributes: Array<{ code: string; value: unknown; unit?: string }>;
    baseAmountMinor?: number;
    status: "active" | "inactive";
  }>;
  physicalConfig?: Record<string, unknown>;
  serviceConfig?: Record<string, unknown>;
  rentalConfig?: Record<string, unknown>;
  customConfig?: Record<string, unknown>;
  location?: {
    type: "Point";
    coordinates: number[];
    formattedAddress?: string;
    city?: string;
    province?: string;
    country?: string;
  };
  seo?: { title?: string; description?: string };
  createdBy?: mongoose.Types.ObjectId;
}

const offeringSchema = new Schema<IOffering>(
  {
    merchantId: tenantRef,
    categoryId: { type: Schema.Types.ObjectId, ref: "Category" },
    code: { type: String, required: true, trim: true, uppercase: true },
    slug: { type: String, required: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    shortDescription: { type: String, maxlength: 300 },
    description: { type: String, required: true, maxlength: 20000 },
    type: { type: String, enum: ["physical", "service", "rental", "custom"], required: true },
    status: { type: String, enum: ["draft", "active", "archived"], default: "draft" },
    media: { type: [mediaSchema], default: [] },
    pricing: {
      model: { type: String, enum: ["fixed", "per_unit", "per_duration", "quote"], required: true },
      baseAmountMinor: { type: Number, min: 0 },
      currency: { type: String, default: "IDR", uppercase: true },
      unit: String,
      durationUnit: { type: String, enum: ["hour", "day", "night", "week"] },
    },
    inventory: {
      mode: { type: String, enum: ["none", "stock", "capacity", "calendar"], default: "none" },
      trackInventory: { type: Boolean, default: false },
      allowBackorder: { type: Boolean, default: false },
    },
    attributes: { type: [offeringAttributeSchema], default: [] },
    variants: { type: [offeringVariantSchema], default: [] },
    physicalConfig: Schema.Types.Mixed,
    serviceConfig: Schema.Types.Mixed,
    rentalConfig: Schema.Types.Mixed,
    customConfig: Schema.Types.Mixed,
    location: { type: offeringLocationSchema, default: undefined },
    seo: { title: String, description: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);
offeringSchema.index({ merchantId: 1, code: 1 }, { unique: true });
offeringSchema.index({ merchantId: 1, slug: 1 }, { unique: true });
offeringSchema.index({ merchantId: 1, status: 1, type: 1 });
offeringSchema.index({ merchantId: 1, categoryId: 1 });
offeringSchema.index({ location: "2dsphere" }, { sparse: true });

const channelListingSchema = new Schema(
  {
    merchantId: tenantRef,
    channelId: { type: Schema.Types.ObjectId, ref: "Channel", required: true },
    offeringId: { type: Schema.Types.ObjectId, ref: "Offering", required: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    visible: { type: Boolean, default: true },
    purchasable: { type: Boolean, default: true },
    titleOverride: String,
    descriptionOverride: String,
    minimumQuantity: { type: Number, min: 1 },
    maximumQuantity: { type: Number, min: 1 },
    availableFrom: Date,
    availableUntil: Date,
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);
channelListingSchema.index({ merchantId: 1, channelId: 1, offeringId: 1 }, { unique: true });

const priceListSchema = new Schema(
  {
    merchantId: tenantRef,
    code: { type: String, required: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    currency: { type: String, default: "IDR", uppercase: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    validFrom: Date,
    validUntil: Date,
  },
  { timestamps: true }
);
priceListSchema.index({ merchantId: 1, code: 1 }, { unique: true });

const priceEntrySchema = new Schema(
  {
    merchantId: tenantRef,
    priceListId: { type: Schema.Types.ObjectId, ref: "PriceList", required: true },
    offeringId: { type: Schema.Types.ObjectId, ref: "Offering", required: true },
    variantId: Schema.Types.ObjectId,
    pricingModel: { type: String, enum: ["fixed", "per_unit", "per_duration"], required: true },
    amountMinor: { type: Number, required: true, min: 0 },
    minimumQuantity: { type: Number, default: 1, min: 1 },
    maximumQuantity: { type: Number, min: 1 },
    durationUnit: { type: String, enum: ["hour", "day", "night", "week"] },
  },
  { timestamps: true }
);
priceEntrySchema.index({ merchantId: 1, priceListId: 1, offeringId: 1, variantId: 1, minimumQuantity: 1 });

export const Channel = mongoose.models.Channel || mongoose.model<IChannel>("Channel", channelSchema);
export const Category = mongoose.models.Category || mongoose.model("Category", categorySchema);
export const Offering = mongoose.models.Offering || mongoose.model<IOffering>("Offering", offeringSchema);
export const ChannelListing = mongoose.models.ChannelListing || mongoose.model("ChannelListing", channelListingSchema);
export const PriceList = mongoose.models.PriceList || mongoose.model("PriceList", priceListSchema);
export const PriceEntry = mongoose.models.PriceEntry || mongoose.model("PriceEntry", priceEntrySchema);
