import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors";
import Room from "../models/room";
import User from "../models/user";
import Booking from "../models/booking";
import dbConnect from "../config/dbConnect";
import ErrorHandler from "../utils/errorHandler";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "");

export const stripeCheckoutSession = catchAsyncErrors(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    await dbConnect({ throwOnError: true });
    const { searchParams } = new URL(req.url);

    const checkInDate = searchParams.get("checkInDate");
    const checkOutDate = searchParams.get("checkOutDate");
    const daysOfStay = searchParams.get("daysOfStay");
    const roomAmount = searchParams.get("amount");

    const room = await Room.findById(params.id).lean().exec();

    if (!room) {
      throw new ErrorHandler("Room not found", 404);
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: Number(roomAmount) * 100,
            product_data: {
              name: room?.name,
              description: room?.description,
              images: [`${room?.images[0]?.url}`],
            },
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.API_URL}/bookings/me`,
      cancel_url: `${process.env.API_URL}/room/${room?._id}`,
      customer_email: req?.user?.email,
      client_reference_id: params?.id,
      metadata: {
        checkInDate,
        checkOutDate,
        daysOfStay,
      },
    });

    return NextResponse.json(session);
  }
);

export const webhookCheckout = catchAsyncErrors(async (req: NextRequest) => {
  await dbConnect({ throwOnError: true });
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    throw new ErrorHandler("Missing Stripe signature", 400);
  }

  const event = stripe.webhooks.constructEvent(
    rawBody,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET ?? ""
  );

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    const room = session.client_reference_id;
    const userRecord = await User.findOne({ email: session?.customer_email })
      .select({ _id: 1 })
      .lean()
      .exec();

    if (!userRecord) {
      throw new ErrorHandler("User not found for Stripe customer", 404);
    }

    const amountPaid = (session?.amount_total ?? 0) / 100;

    const paymentInfo = {
      id: session.payment_intent,
      status: session.payment_status,
    };

    const checkInDate = session.metadata?.checkInDate;
    const checkOutDate = session.metadata?.checkOutDate;
    const daysOfStay = session.metadata?.daysOfStay;

    await Booking.create({
      room,
      user: userRecord._id,
      checkInDate,
      checkOutDate,
      daysOfStay,
      amountPaid,
      paymentInfo,
      paidAt: Date.now(),
    });

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ success: false });
});
