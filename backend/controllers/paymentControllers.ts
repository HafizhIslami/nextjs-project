import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors";
import Room from "../models/room";
import User from "../models/user";
import Booking from "../models/booking";
import dbConnect from "../config/dbConnect";
import ErrorHandler from "../utils/errorHandler";
import { getRequiredEnv } from "../config/env";
import { normalizeImageUrl } from "@/helpers/imageUrl";
import {
  parseStayDates,
  requireObjectId,
  requireString,
} from "../utils/validation";

const getStripe = () => new Stripe(getRequiredEnv("STRIPE_SECRET_KEY"));

export const stripeCheckoutSession = catchAsyncErrors(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    await dbConnect({ throwOnError: true });
    const { searchParams } = new URL(req.url);

    const { checkInDate, checkOutDate, daysOfStay } = parseStayDates(
      searchParams.get("checkInDate"),
      searchParams.get("checkOutDate")
    );
    const roomId = requireObjectId(params?.id, "room ID");

    const room = await Room.findById(roomId).lean().exec();

    if (!room) {
      throw new ErrorHandler("Room not found", 404);
    }

    const conflictingBooking = await Booking.exists({
      room: room._id,
      checkInDate: { $lt: checkOutDate },
      checkOutDate: { $gt: checkInDate },
    });
    if (conflictingBooking) {
      throw new ErrorHandler("Room is not available for these dates", 409);
    }

    const totalAmount = room.pricePerNight * daysOfStay;
    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      throw new ErrorHandler("Invalid room price", 400);
    }

    const baseUrl = getRequiredEnv("API_URL").replace(/\/$/, "");
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: Math.round(totalAmount * 100),
            product_data: {
              name: room?.name,
              description: room?.description,
              images: [
                normalizeImageUrl(
                  room.images[0]?.url,
                  `${baseUrl}/images/default_room_image.jpg`
                ),
              ],
            },
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${baseUrl}/bookings/me`,
      cancel_url: `${baseUrl}/rooms/${room?._id}`,
      customer_email: req?.user?.email,
      client_reference_id: roomId,
      metadata: {
        checkInDate: checkInDate.toISOString(),
        checkOutDate: checkOutDate.toISOString(),
        daysOfStay: String(daysOfStay),
      },
    });

    return NextResponse.json(session);
  }
);

export const webhookCheckout = catchAsyncErrors(async (req: NextRequest) => {
  await dbConnect({ throwOnError: true });
  const stripe = getStripe();
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    throw new ErrorHandler("Missing Stripe signature", 400);
  }

  const event = stripe.webhooks.constructEvent(
    rawBody,
    signature,
    getRequiredEnv("STRIPE_WEBHOOK_SECRET")
  );

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    if (session.payment_status !== "paid") {
      return NextResponse.json({ success: true, message: "Payment is not completed" });
    }

    const roomId = requireObjectId(session.client_reference_id, "room ID");
    const room = await Room.findById(roomId).select({ pricePerNight: 1 }).lean().exec();
    if (!room) {
      throw new ErrorHandler("Room not found for Stripe session", 404);
    }

    const checkInDateValue = requireString(
      session.metadata?.checkInDate,
      "Check-in date"
    );
    const checkOutDateValue = requireString(
      session.metadata?.checkOutDate,
      "Check-out date"
    );
    const { checkInDate, checkOutDate, daysOfStay } = parseStayDates(
      checkInDateValue,
      checkOutDateValue
    );
    const expectedAmount = Math.round(room.pricePerNight * daysOfStay * 100);
    if (session.amount_total !== expectedAmount) {
      throw new ErrorHandler("Stripe amount does not match room pricing", 400);
    }

    const paymentIntent = requireString(session.payment_intent, "Payment intent");
    const customerEmail = requireString(session.customer_email, "Customer email").toLowerCase();
    const userRecord = await User.findOne({ email: customerEmail })
      .select({ _id: 1 })
      .lean()
      .exec();

    if (!userRecord) {
      throw new ErrorHandler("User not found for Stripe customer", 404);
    }

    const existingBooking = await Booking.exists({ stripeSessionId: session.id });
    if (existingBooking) {
      return NextResponse.json({ success: true, duplicate: true });
    }

    const conflictingBooking = await Booking.exists({
      room: room._id,
      checkInDate: { $lt: checkOutDate },
      checkOutDate: { $gt: checkInDate },
    });
    if (conflictingBooking) {
      throw new ErrorHandler("Room is no longer available for these dates", 409);
    }

    await Booking.findOneAndUpdate(
      { stripeSessionId: session.id },
      {
        $setOnInsert: {
          stripeSessionId: session.id,
          room: room._id,
          user: userRecord._id,
          checkInDate,
          checkOutDate,
          daysOfStay,
          amountPaid: expectedAmount / 100,
          paymentInfo: {
            id: paymentIntent,
            status: session.payment_status,
          },
          paidAt: new Date(),
        },
      },
      { upsert: true, runValidators: true }
    );

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ success: false });
});
