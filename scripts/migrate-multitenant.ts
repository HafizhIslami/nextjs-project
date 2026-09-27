import mongoose from "mongoose";
import Booking from "../backend/models/booking";
import { Channel, PriceList } from "../backend/models/catalog";
import Merchant, { MerchantDomain } from "../backend/models/merchant";
import { MerchantMember } from "../backend/models/merchantIdentity";
import Room from "../backend/models/room";
import User from "../backend/models/user";
import { DEFAULT_MERCHANT_ID } from "../backend/tenancy/tenantContext";

const required = (name: string) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}`);
  return value;
};

const main = async () => {
  const uri = process.env.DB_URI?.trim() || process.env.DB_LOCAL_URI?.trim() || required("DB_URI");
  await mongoose.connect(uri);

  const merchantId = new mongoose.Types.ObjectId(process.env.DEFAULT_MERCHANT_ID || DEFAULT_MERCHANT_ID);
  const merchantCode = process.env.DEFAULT_MERCHANT_CODE?.trim().toLowerCase() || "roomi";
  const currency = process.env.DEFAULT_MERCHANT_CURRENCY?.trim().toUpperCase() || "USD";

  const merchant = await Merchant.findOneAndUpdate(
    { _id: merchantId },
    {
      $set: {
        merchantCode,
        name: process.env.DEFAULT_MERCHANT_NAME?.trim() || "Roomi",
        status: "active",
        settings: {
          currency,
          locale: process.env.DEFAULT_MERCHANT_LOCALE || "en-US",
          timezone: process.env.DEFAULT_MERCHANT_TIMEZONE || "Asia/Jakarta",
          taxEnabled: false,
          pricesIncludeTax: true,
          guestCheckoutEnabled: false,
        },
        branding: {
          logoUrl: "/images/roomi_header_small.png",
          faviconUrl: "/favicon.ico",
          primaryColor: "#a7194b",
          secondaryColor: "#23191f",
          accentColor: "#f6dce6",
        },
        enabledModules: ["catalog", "commerce", "rental"],
      },
    },
    { upsert: true, returnDocument: "after", runValidators: true }
  );

  const primaryHostname = process.env.DEFAULT_MERCHANT_HOSTNAME?.trim().toLowerCase();
  if (primaryHostname) {
    await MerchantDomain.findOneAndUpdate(
      { hostname: primaryHostname },
      {
        $set: {
          merchantId,
          type: primaryHostname.endsWith(process.env.PLATFORM_ROOT_DOMAIN || "roomi.local")
            ? "platform_subdomain"
            : "custom_domain",
          isPrimary: true,
          status: "active",
          sslStatus: "active",
        },
      },
      { upsert: true, runValidators: true }
    );
  }

  for (const definition of [
    { code: "retail", name: "Retail", type: "retail", visibility: "public" },
    { code: "reseller", name: "Reseller", type: "reseller", visibility: "private" },
  ] as const) {
    const priceList = await PriceList.findOneAndUpdate(
      { merchantId, code: `${definition.code}-default` },
      { $set: { name: `${definition.name} pricing`, currency, status: "active" } },
      { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true }
    );
    await Channel.findOneAndUpdate(
      { merchantId, code: definition.code },
      {
        $set: {
          name: definition.name,
          type: definition.type,
          visibility: definition.visibility,
          status: "active",
          defaultPriceListId: priceList._id,
          rules: {
            requireLogin: definition.type === "reseller",
            requireApproval: definition.type === "reseller",
            allowGuestCheckout: false,
            allowBackorder: false,
            allowedPaymentMethods: ["stripe"],
          },
        },
      },
      { upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
  }

  const admins = await User.find({ role: "admin" }).select({ _id: 1 }).lean().exec();
  await Promise.all(admins.map((admin) => MerchantMember.findOneAndUpdate(
    { merchantId, userId: admin._id },
    {
      $set: { role: "owner", status: "active", joinedAt: new Date() },
      $setOnInsert: { merchantId, userId: admin._id, permissions: [] },
    },
    { upsert: true, runValidators: true }
  )));

  const roomResult = await Room.updateMany(
    { $or: [{ merchantId: { $exists: false } }, { merchantId: null }] },
    { $set: { merchantId } }
  );
  const bookingResult = await Booking.updateMany(
    { $or: [{ merchantId: { $exists: false } }, { merchantId: null }] },
    { $set: { merchantId } }
  );

  console.log(JSON.stringify({
    merchant: { id: merchant._id.toString(), code: merchant.merchantCode },
    migratedRooms: roomResult.modifiedCount,
    migratedBookings: bookingResult.modifiedCount,
    owners: admins.length,
  }, null, 2));
};

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => mongoose.disconnect());
