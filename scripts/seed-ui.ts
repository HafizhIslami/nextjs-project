import mongoose from "mongoose";
import Booking from "../backend/models/booking";
import Room from "../backend/models/room";
import User from "../backend/models/user";
import Merchant, { MerchantDomain } from "../backend/models/merchant";
import { Channel, PriceList } from "../backend/models/catalog";
import { MerchantMember } from "../backend/models/merchantIdentity";
import { PlatformAuditLog, PlatformMember } from "../backend/models/platform";
import { DEFAULT_MERCHANT_ID } from "../backend/tenancy/tenantContext";

const required = (name: string): string => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name} in .env.test`);
  return value;
};

const seedUser = async (email: string, password: string, role: string) => {
  let user = await User.findOne({ email }).select("+password").exec();

  if (!user) {
    user = new User({
      name: role === "admin" ? "UI Test Admin" : "UI Test User",
      email,
      password,
      role,
    });
  } else {
    user.password = password;
    user.role = role;
  }

  await user.save();
  return user;
};

const seedRoom = async (
  userId: mongoose.Types.ObjectId,
  merchantId: mongoose.Types.ObjectId
) => {
  await Room.collection.updateOne(
    { name: "Roomi UI Test Room" },
    {
      $set: {
        name: "Roomi UI Test Room",
        description: "Deterministic room fixture for Roomi UI testing.",
        pricePerNight: 100,
        address: "New York, NY, USA",
        location: {
          type: "Point",
          coordinates: [-74.006, 40.7128],
          formattedAddress: "New York, NY, USA",
          city: "New York",
          state: "NY",
          zipcode: "10001",
          country: "US",
        },
        guestCapacity: 2,
        numOfBeds: 1,
        isInternet: true,
        isBreakfast: true,
        isAirConditioned: true,
        isPetsAllowed: false,
        isRoomCleaning: true,
        ratings: 0,
        numOfReviews: 0,
        images: [
          {
            public_id: "roomi-ui-test-room",
            url: "/images/default_room_image.jpg",
          },
        ],
        category: "King",
        reviews: [],
        user: userId,
        merchantId,
      },
    },
    { upsert: true }
  );
};

const seedBookings = async (
  userId: mongoose.Types.ObjectId,
  roomId: mongoose.Types.ObjectId,
  merchantId: mongoose.Types.ObjectId
) => {
  const now = Date.now();
  const completedCheckIn = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const completedCheckOut = new Date(now - 4 * 24 * 60 * 60 * 1000);
  const upcomingCheckIn = new Date(now + 14 * 24 * 60 * 60 * 1000);
  const upcomingCheckOut = new Date(now + 17 * 24 * 60 * 60 * 1000);

  for (const booking of [
    {
      stripeSessionId: "roomi-ui-test-completed",
      checkInDate: completedCheckIn,
      checkOutDate: completedCheckOut,
      paidAt: completedCheckOut,
      createdAt: completedCheckOut,
    },
    {
      stripeSessionId: "roomi-ui-test-upcoming",
      checkInDate: upcomingCheckIn,
      checkOutDate: upcomingCheckOut,
      paidAt: new Date(now),
      createdAt: new Date(now),
    },
  ]) {
    await Booking.collection.updateOne(
      { stripeSessionId: booking.stripeSessionId },
      {
        $set: {
          ...booking,
          room: roomId,
          merchantId,
          user: userId,
          amountPaid: 300,
          daysOfStay: 3,
          paymentInfo: {
            id: `pi_${booking.stripeSessionId}`,
            status: "paid",
          },
        },
      },
      { upsert: true }
    );
  }
};

const main = async () => {
  const uri = required("DB_LOCAL_URI");
  const userEmail = required("UI_TEST_USER_EMAIL");
  const userPassword = required("UI_TEST_USER_PASSWORD");
  const adminEmail = required("UI_TEST_ADMIN_EMAIL");
  const adminPassword = required("UI_TEST_ADMIN_PASSWORD");

  await mongoose.connect(uri);
  const staleMerchants = await Merchant.find({ merchantCode: /^platform-e2e-/ }).select({ _id: 1 }).lean().exec();
  const staleMerchantIds = staleMerchants.map((merchant) => merchant._id);
  if (staleMerchantIds.length) {
    await Promise.all([
      Channel.deleteMany({ merchantId: { $in: staleMerchantIds } }),
      PriceList.deleteMany({ merchantId: { $in: staleMerchantIds } }),
      MerchantMember.deleteMany({ merchantId: { $in: staleMerchantIds } }),
      MerchantDomain.deleteMany({ merchantId: { $in: staleMerchantIds } }),
      PlatformAuditLog.deleteMany({ merchantId: { $in: staleMerchantIds } }),
    ]);
    await Merchant.deleteMany({ _id: { $in: staleMerchantIds } });
  }
  await User.deleteMany({ email: /^platform\.owner\.(desktop|mobile)@example\.test$/ });
  const merchantId = new mongoose.Types.ObjectId(
    process.env.DEFAULT_MERCHANT_ID || DEFAULT_MERCHANT_ID
  );
  const merchant = await Merchant.findOneAndUpdate(
    { _id: merchantId },
    {
      $set: {
        merchantCode: process.env.DEFAULT_MERCHANT_CODE || "roomi",
        name: "Roomi",
        status: "active",
        branding: {
          primaryColor: "#a7194b",
          secondaryColor: "#23191f",
          accentColor: "#f6dce6",
          logoUrl: "/images/roomi_header_small.png",
        },
        settings: {
          currency: "USD",
          locale: "en-US",
          timezone: "Asia/Jakarta",
          taxEnabled: false,
          pricesIncludeTax: true,
          guestCheckoutEnabled: false,
        },
        enabledModules: ["catalog", "commerce", "rental"],
      },
    },
    { upsert: true, returnDocument: "after", runValidators: true }
  );
  const priceList = await PriceList.findOneAndUpdate(
    { merchantId, code: "retail-default" },
    { $set: { name: "Retail pricing", currency: "USD", status: "active" } },
    { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true }
  );
  await Channel.findOneAndUpdate(
    { merchantId, code: "retail" },
    {
      $set: {
        name: "Retail",
        type: "retail",
        status: "active",
        visibility: "public",
        defaultPriceListId: priceList._id,
        rules: { requireLogin: false, requireApproval: false, allowGuestCheckout: false, allowBackorder: false, allowedPaymentMethods: ["stripe"] },
      },
    },
    { upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );

  const user = await seedUser(userEmail, userPassword, "user");
  const admin = await seedUser(adminEmail, adminPassword, "admin");
  await PlatformMember.findOneAndUpdate(
    { userId: admin._id },
    { $set: { role: "owner", status: "active", mfaRequired: false }, $setOnInsert: { permissions: [] } },
    { upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
  await MerchantMember.findOneAndUpdate(
    { merchantId, userId: admin._id },
    { $set: { role: "owner", status: "active", joinedAt: new Date() }, $setOnInsert: { permissions: [] } },
    { upsert: true, runValidators: true }
  );
  await seedRoom(user._id, merchantId);
  const room = await Room.findOne({ name: "Roomi UI Test Room" })
    .select({ _id: 1 })
    .lean()
    .exec();
  if (!room) throw new Error("UI test room was not created");
  await seedBookings(user._id, room._id, merchant._id);
  console.log("UI test merchant, users, and room are ready.");
};

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
