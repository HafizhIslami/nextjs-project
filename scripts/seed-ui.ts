import mongoose from "mongoose";
import Booking from "../backend/models/booking";
import Room from "../backend/models/room";
import User from "../backend/models/user";

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

const seedRoom = async (userId: mongoose.Types.ObjectId) => {
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
      },
    },
    { upsert: true }
  );
};

const seedBookings = async (
  userId: mongoose.Types.ObjectId,
  roomId: mongoose.Types.ObjectId
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
  const user = await seedUser(userEmail, userPassword, "user");
  await seedUser(adminEmail, adminPassword, "admin");
  await seedRoom(user._id);
  const room = await Room.findOne({ name: "Roomi UI Test Room" })
    .select({ _id: 1 })
    .lean()
    .exec();
  if (!room) throw new Error("UI test room was not created");
  await seedBookings(user._id, room._id);
  console.log("UI test users and room are ready.");
};

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
