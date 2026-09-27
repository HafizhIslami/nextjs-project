import mongoose from "mongoose";
import { Channel, ChannelListing, Offering, PriceList } from "../backend/models/catalog";
import Merchant, { MerchantDomain } from "../backend/models/merchant";

const main = async () => {
  const uri = process.env.DB_URI?.trim() || process.env.DB_LOCAL_URI?.trim();
  if (!uri) throw new Error("DB_URI or DB_LOCAL_URI is required");
  await mongoose.connect(uri);

  const merchant = await Merchant.findOneAndUpdate(
    { merchantCode: "sayur-segar" },
    {
      $set: {
        name: "Sayur Segar",
        status: "active",
        businessType: "groceries",
        branding: {
          primaryColor: "#277a4b",
          secondaryColor: "#173c2a",
          accentColor: "#dcf4e4",
        },
        settings: {
          currency: "IDR",
          locale: "id-ID",
          timezone: "Asia/Jakarta",
          taxEnabled: false,
          pricesIncludeTax: true,
          guestCheckoutEnabled: false,
        },
        enabledModules: ["catalog", "commerce"],
      },
    },
    { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true }
  );

  await MerchantDomain.findOneAndUpdate(
    { hostname: "sayur-segar.localhost" },
    { $set: { merchantId: merchant._id, type: "platform_subdomain", isPrimary: true, status: "active", sslStatus: "active" } },
    { upsert: true, runValidators: true }
  );
  const priceList = await PriceList.findOneAndUpdate(
    { merchantId: merchant._id, code: "retail-default" },
    { $set: { name: "Retail pricing", currency: "IDR", status: "active" } },
    { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true }
  );
  const channel = await Channel.findOneAndUpdate(
    { merchantId: merchant._id, code: "retail" },
    {
      $set: {
        name: "Belanja Harian",
        type: "retail",
        status: "active",
        visibility: "public",
        defaultPriceListId: priceList._id,
        rules: { requireLogin: false, requireApproval: false, allowGuestCheckout: false, allowBackorder: false, allowedPaymentMethods: ["stripe"] },
      },
    },
    { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true }
  );

  await Offering.collection.updateMany(
    { merchantId: merchant._id, "location.coordinates": { $size: 0 } },
    { $unset: { location: "" } }
  );

  for (const item of [
    { code: "VEG-TOMATO-1KG", slug: "tomat-segar-1kg", name: "Tomat Segar 1 kg", amount: 28000 },
    { code: "VEG-SPINACH", slug: "bayam-organik", name: "Bayam Organik", amount: 12000 },
    { code: "VEG-CARROT-1KG", slug: "wortel-premium-1kg", name: "Wortel Premium 1 kg", amount: 32000 },
  ]) {
    const offering = await Offering.findOneAndUpdate(
      { merchantId: merchant._id, code: item.code },
      {
        $set: {
          slug: item.slug,
          name: item.name,
          shortDescription: "Dipilih segar dan dikemas dengan hati-hati.",
          description: `${item.name} berkualitas untuk kebutuhan rumah dan usaha Anda.`,
          type: "physical",
          status: "active",
          pricing: { model: "per_unit", baseAmountMinor: item.amount, currency: "IDR", unit: "pack" },
          inventory: { mode: "none", trackInventory: false, allowBackorder: false },
          media: [{ type: "image", url: "/images/default_room_image.jpg", alt: item.name, sortOrder: 0 }],
        },
      },
      { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true }
    );
    await ChannelListing.findOneAndUpdate(
      { merchantId: merchant._id, channelId: channel._id, offeringId: offering._id },
      { $set: { status: "active", visible: true, purchasable: true, minimumQuantity: 1 } },
      { upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
  }

  console.log("Demo merchant ready at http://sayur-segar.localhost:3000");
};

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => mongoose.disconnect());
