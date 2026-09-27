import mongoose from "mongoose";
import { Channel, ChannelListing, Offering, PriceEntry } from "../models/catalog";
import {
  InventoryMovement,
  InventoryResource,
  Order,
  Reservation,
} from "../models/commerce";
import { Customer } from "../models/merchantIdentity";
import type { IUser } from "../models/user";
import type { TenantContext } from "../tenancy/tenantContext";
import ErrorHandler from "../utils/errorHandler";
import { calculateDuration, calculateLineTotal } from "./orderPricing";

type RequestedItem = {
  offeringId: string;
  variantId?: string;
  quantity: number;
  startAt?: string;
  endAt?: string;
  inventoryResourceId?: string;
  configuration?: Record<string, unknown>;
};

const orderNumber = (merchantCode: string) => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = new mongoose.Types.ObjectId().toString().slice(-8).toUpperCase();
  return `${merchantCode.toUpperCase()}-${date}-${suffix}`;
};

export const createPricedOrder = async ({
  tenant,
  user,
  channelCode,
  rawItems,
}: {
  tenant: TenantContext;
  user: IUser;
  channelCode: string;
  rawItems: unknown;
}) => {
  if (!Array.isArray(rawItems) || rawItems.length === 0 || rawItems.length > 50) {
    throw new ErrorHandler("Order must contain between 1 and 50 items", 400);
  }

  const merchantId = new mongoose.Types.ObjectId(tenant.merchantId);
  const channel = await Channel.findOne({
    merchantId,
    code: channelCode,
    status: "active",
  }).lean().exec();
  if (!channel) throw new ErrorHandler("Sales channel not found", 404);

  const customer = await Customer.findOneAndUpdate(
    { merchantId, userId: user._id },
    {
      $set: { name: user.name, email: user.email, status: "active" },
      $setOnInsert: {
        merchantId,
        userId: user._id,
        customerCode: `CUS-${user._id.toString().slice(-8).toUpperCase()}`,
        type: "individual",
        channelIds: [channel._id],
        customerGroupIds: [],
        reseller: { requested: false, approved: false },
      },
    },
    { upsert: true, returnDocument: "after", runValidators: true }
  );

  if (channel.visibility === "private") {
    const approvedForChannel = customer.channelIds.some(
      (id: mongoose.Types.ObjectId) => id.toString() === channel._id.toString()
    );
    if (!approvedForChannel || (channel.type === "reseller" && !customer.reseller.approved)) {
      throw new ErrorHandler("Your account is not approved for this channel", 403);
    }
  }

  const requestedItems: RequestedItem[] = rawItems.map((raw, index) => {
    if (!raw || typeof raw !== "object") throw new ErrorHandler(`Item ${index + 1} is invalid`, 400);
    const item = raw as Record<string, unknown>;
    if (!mongoose.Types.ObjectId.isValid(String(item.offeringId))) {
      throw new ErrorHandler(`Item ${index + 1} has an invalid offering`, 400);
    }
    return {
      offeringId: String(item.offeringId),
      variantId: item.variantId ? String(item.variantId) : undefined,
      quantity: Number(item.quantity || 1),
      startAt: item.startAt ? String(item.startAt) : undefined,
      endAt: item.endAt ? String(item.endAt) : undefined,
      inventoryResourceId: item.inventoryResourceId ? String(item.inventoryResourceId) : undefined,
      configuration: item.configuration && typeof item.configuration === "object"
        ? item.configuration as Record<string, unknown>
        : undefined,
    };
  });

  const offeringIds = requestedItems.map((item) => new mongoose.Types.ObjectId(item.offeringId));
  const [offerings, listings] = await Promise.all([
    Offering.find({ merchantId, _id: { $in: offeringIds }, status: "active" }).lean().exec(),
    ChannelListing.find({
      merchantId,
      channelId: channel._id,
      offeringId: { $in: offeringIds },
      status: "active",
      visible: true,
      purchasable: true,
    }).lean().exec(),
  ]);
  const offeringMap = new Map(offerings.map((item) => [item._id.toString(), item]));
  const listingMap = new Map(listings.map((item) => [item.offeringId.toString(), item]));

  const pricedItems = [];
  for (const item of requestedItems) {
    const offering = offeringMap.get(item.offeringId);
    const listing = listingMap.get(item.offeringId);
    if (!offering || !listing) throw new ErrorHandler("An offering is unavailable in this channel", 409);
    if (item.quantity < (listing.minimumQuantity || 1) ||
        (listing.maximumQuantity && item.quantity > listing.maximumQuantity)) {
      throw new ErrorHandler(`Quantity is not allowed for ${offering.name}`, 400);
    }
    if (offering.pricing.model === "quote") {
      throw new ErrorHandler(`${offering.name} requires a quotation`, 409);
    }

    const channelPrice = channel.defaultPriceListId
      ? await PriceEntry.findOne({
          merchantId,
          priceListId: channel.defaultPriceListId,
          offeringId: offering._id,
          minimumQuantity: { $lte: item.quantity },
          $or: [{ maximumQuantity: { $exists: false } }, { maximumQuantity: { $gte: item.quantity } }],
        }).sort({ minimumQuantity: -1 }).lean().exec()
      : null;
    const pricingModel = channelPrice?.pricingModel || offering.pricing.model;
    const amountMinor = channelPrice?.amountMinor ?? offering.pricing.baseAmountMinor;
    if (amountMinor === undefined) throw new ErrorHandler(`No price is configured for ${offering.name}`, 409);

    const reservation = pricingModel === "per_duration" || offering.inventory.mode === "calendar"
      ? calculateDuration(item.startAt, item.endAt, offering.pricing.durationUnit)
      : undefined;
    const subtotalMinor = calculateLineTotal({
      amountMinor,
      quantity: item.quantity,
      pricingModel,
      duration: reservation?.duration,
    });

    pricedItems.push({
      offeringId: offering._id,
      variantId: item.variantId,
      offeringType: offering.type,
      codeSnapshot: offering.code,
      nameSnapshot: offering.name,
      imageSnapshot: offering.media[0]?.url,
      unitPriceMinor: amountMinor,
      quantity: item.quantity,
      duration: reservation?.duration,
      durationUnit: offering.pricing.durationUnit,
      configurationSnapshot: {
        ...item.configuration,
        startAt: reservation?.startAt,
        endAt: reservation?.endAt,
        inventoryResourceId: item.inventoryResourceId,
      },
      subtotalMinor,
      discountMinor: 0,
      taxMinor: 0,
      totalMinor: subtotalMinor,
      inventoryMode: offering.inventory.mode,
      inventoryResourceId: item.inventoryResourceId,
      startAt: reservation?.startAt,
      endAt: reservation?.endAt,
    });
  }

  const subtotalMinor = pricedItems.reduce((sum, item) => sum + item.subtotalMinor, 0);
  if (channel.rules.minimumOrderAmountMinor && subtotalMinor < Number(channel.rules.minimumOrderAmountMinor)) {
    throw new ErrorHandler("Order does not meet this channel's minimum amount", 400);
  }

  const order = await Order.create({
    merchantId,
    channelId: channel._id,
    customerId: customer._id,
    orderNumber: orderNumber(tenant.merchantCode),
    status: "pending",
    paymentStatus: "unpaid",
    fulfillmentStatus: "unfulfilled",
    customerSnapshot: { name: customer.name, email: customer.email, phone: customer.phone },
    items: pricedItems.map((item) => ({
      offeringId: item.offeringId,
      variantId: item.variantId,
      offeringType: item.offeringType,
      codeSnapshot: item.codeSnapshot,
      nameSnapshot: item.nameSnapshot,
      imageSnapshot: item.imageSnapshot,
      unitPriceMinor: item.unitPriceMinor,
      quantity: item.quantity,
      duration: item.duration,
      durationUnit: item.durationUnit,
      configurationSnapshot: item.configurationSnapshot,
      subtotalMinor: item.subtotalMinor,
      discountMinor: item.discountMinor,
      taxMinor: item.taxMinor,
      totalMinor: item.totalMinor,
    })),
    totals: {
      subtotalMinor,
      discountMinor: 0,
      taxMinor: 0,
      shippingMinor: 0,
      grandTotalMinor: subtotalMinor,
    },
    currency: tenant.currency,
    placedAt: new Date(),
  });

  const reservedStock: Array<{ resourceId: mongoose.Types.ObjectId; quantity: number }> = [];
  try {
    for (let index = 0; index < pricedItems.length; index += 1) {
      const item = pricedItems[index];
      if (item.inventoryMode === "none") continue;
      if (!item.inventoryResourceId || !mongoose.Types.ObjectId.isValid(item.inventoryResourceId)) {
        throw new ErrorHandler(`Inventory resource is required for ${item.nameSnapshot}`, 400);
      }
      const resourceId = new mongoose.Types.ObjectId(item.inventoryResourceId);

      if (item.inventoryMode === "stock") {
        const resource = await InventoryResource.findOneAndUpdate(
          {
            _id: resourceId,
            merchantId,
            offeringId: item.offeringId,
            status: "active",
            $expr: { $gte: [{ $subtract: ["$stock.onHand", "$stock.reserved"] }, item.quantity] },
          },
          { $inc: { "stock.reserved": item.quantity } },
          { returnDocument: "after" }
        );
        if (!resource) throw new ErrorHandler(`${item.nameSnapshot} does not have enough stock`, 409);
        reservedStock.push({ resourceId, quantity: item.quantity });
        await InventoryMovement.create({
          merchantId,
          inventoryResourceId: resourceId,
          type: "reservation",
          quantity: item.quantity,
          referenceType: "order",
          referenceId: order._id,
          createdBy: user._id,
        });
      } else {
        if (!item.startAt || !item.endAt) throw new ErrorHandler("Reservation dates are required", 400);
        const conflict = await Reservation.exists({
          merchantId,
          inventoryResourceId: resourceId,
          status: { $in: ["held", "confirmed", "checked_in"] },
          startAt: { $lt: item.endAt },
          endAt: { $gt: item.startAt },
        });
        if (conflict) throw new ErrorHandler(`${item.nameSnapshot} is unavailable for that period`, 409);
        await Reservation.create({
          merchantId,
          orderId: order._id,
          orderItemId: order.items[index]._id,
          offeringId: item.offeringId,
          inventoryResourceId: resourceId,
          customerId: customer._id,
          startAt: item.startAt,
          endAt: item.endAt,
          quantity: item.quantity,
          status: "held",
          holdExpiresAt: new Date(Date.now() + 30 * 60 * 1000),
        });
      }
    }
  } catch (error) {
    await Promise.all(reservedStock.map(({ resourceId, quantity }) =>
      InventoryResource.updateOne(
        { _id: resourceId, merchantId },
        { $inc: { "stock.reserved": -quantity } }
      )
    ));
    await Reservation.deleteMany({ merchantId, orderId: order._id, status: "held" });
    order.status = "cancelled";
    order.fulfillmentStatus = "cancelled";
    order.cancelledAt = new Date();
    await order.save();
    throw error;
  }

  order.fulfillmentStatus = pricedItems.some((item) => item.inventoryMode !== "none")
    ? "reserved"
    : "unfulfilled";
  await order.save();
  return order;
};
