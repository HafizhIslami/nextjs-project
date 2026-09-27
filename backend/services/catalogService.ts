import mongoose from "mongoose";
import { Channel, ChannelListing, Offering, PriceEntry } from "../models/catalog";
import type { TenantContext } from "../tenancy/tenantContext";

export type StorefrontOffering = {
  id: string;
  code: string;
  slug: string;
  name: string;
  shortDescription?: string;
  description: string;
  type: "physical" | "service" | "rental" | "custom";
  media: Array<{ url: string; alt?: string }>;
  price: {
    model: string;
    amountMinor?: number;
    currency: string;
    unit?: string;
    durationUnit?: string;
  };
  purchasable: boolean;
  minimumQuantity: number;
};

export type StorefrontCatalog = {
  channel: { id: string; code: string; name: string; type: string; visibility: string };
  offerings: StorefrontOffering[];
};

export const getStorefrontCatalog = async (
  tenant: TenantContext,
  channelCode = "retail",
  limit = 24
): Promise<StorefrontCatalog | null> => {
  const merchantId = new mongoose.Types.ObjectId(tenant.merchantId);
  const channel = await Channel.findOne({
    merchantId,
    code: channelCode,
    status: "active",
  })
    .lean()
    .exec();

  if (!channel) return null;

  const listings = await ChannelListing.find({
    merchantId,
    channelId: channel._id,
    status: "active",
    visible: true,
    $and: [
      { $or: [{ availableFrom: { $exists: false } }, { availableFrom: { $lte: new Date() } }] },
      { $or: [{ availableUntil: { $exists: false } }, { availableUntil: { $gte: new Date() } }] },
    ],
  })
    .sort({ sortOrder: 1, createdAt: -1 })
    .limit(Math.min(Math.max(limit, 1), 100))
    .lean()
    .exec();

  const offeringIds = listings.map((listing) => listing.offeringId);
  const offerings = await Offering.find({
    merchantId,
    _id: { $in: offeringIds },
    status: "active",
  })
    .lean()
    .exec();

  const priceEntries = channel.defaultPriceListId
    ? await PriceEntry.find({
        merchantId,
        priceListId: channel.defaultPriceListId,
        offeringId: { $in: offeringIds },
        minimumQuantity: { $lte: 1 },
      })
        .sort({ minimumQuantity: -1 })
        .lean()
        .exec()
    : [];

  const offeringMap = new Map(offerings.map((offering) => [offering._id.toString(), offering]));
  const priceMap = new Map<string, (typeof priceEntries)[number]>();
  priceEntries.forEach((entry) => {
    const key = entry.offeringId.toString();
    if (!priceMap.has(key)) priceMap.set(key, entry);
  });

  return {
    channel: {
      id: channel._id.toString(),
      code: channel.code,
      name: channel.name,
      type: channel.type,
      visibility: channel.visibility,
    },
    offerings: listings.flatMap((listing) => {
      const offering = offeringMap.get(listing.offeringId.toString());
      if (!offering) return [];
      const priceEntry = priceMap.get(offering._id.toString());
      return [{
        id: offering._id.toString(),
        code: offering.code,
        slug: offering.slug,
        name: listing.titleOverride || offering.name,
        shortDescription: offering.shortDescription,
        description: listing.descriptionOverride || offering.description,
        type: offering.type,
        media: offering.media.map((item: { url: string; alt?: string }) => ({
          url: item.url,
          alt: item.alt,
        })),
        price: {
          model: priceEntry?.pricingModel || offering.pricing.model,
          amountMinor: priceEntry?.amountMinor ?? offering.pricing.baseAmountMinor,
          currency: priceEntry ? tenant.currency : offering.pricing.currency,
          unit: offering.pricing.unit,
          durationUnit: offering.pricing.durationUnit,
        },
        purchasable: listing.purchasable,
        minimumQuantity: listing.minimumQuantity || 1,
      }];
    }),
  };
};

export const getStorefrontOffering = async (
  tenant: TenantContext,
  slug: string,
  channelCode = "retail"
): Promise<StorefrontOffering | null> => {
  const catalog = await getStorefrontCatalog(tenant, channelCode, 100);
  return catalog?.offerings.find((offering) => offering.slug === slug) || null;
};
