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
import { requireTenantContext } from "../tenancy/requestTenant";
import { tenantFilter } from "../tenancy/scope";
import { Order, Payment, Reservation } from "../models/commerce";
import { Customer } from "../models/merchantIdentity";

const getStripe = () => new Stripe(getRequiredEnv("STRIPE_SECRET_KEY"));

const tenantBaseUrl = (request: NextRequest, primaryHostname: string, hostname: string) =>
  hostname.endsWith("localhost") || hostname === "127.0.0.1"
    ? request.nextUrl.origin
    : `${request.headers.get("x-forwarded-proto") || "https"}://${primaryHostname}`;

export const orderCheckoutSession = catchAsyncErrors(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    await dbConnect({ throwOnError: true });
    const tenant = await requireTenantContext(req);
    const orderId = requireObjectId(params.id, "order ID");
    const customer = await Customer.findOne({
      merchantId: tenant.merchantId,
      userId: req.user._id,
    }).select({ _id: 1 }).lean().exec();
    if (!customer) throw new ErrorHandler("Customer account not found", 404);

    const order = await Order.findOne({
      _id: orderId,
      merchantId: tenant.merchantId,
      customerId: customer._id,
      status: { $in: ["pending", "confirmed"] },
      paymentStatus: { $in: ["unpaid", "failed"] },
    });
    if (!order) throw new ErrorHandler("Payable order not found", 404);
    if (order.totals.grandTotalMinor <= 0) throw new ErrorHandler("Order total is invalid", 400);

    const payment = await Payment.findOneAndUpdate(
      { merchantId: tenant.merchantId, idempotencyKey: `checkout:${order._id}` },
      {
        $set: {
          status: "pending",
          amountMinor: order.totals.grandTotalMinor,
          currency: order.currency,
        },
        $setOnInsert: {
          merchantId: tenant.merchantId,
          orderId: order._id,
          provider: "stripe",
          idempotencyKey: `checkout:${order._id}`,
          refundedAmountMinor: 0,
        },
      },
      { upsert: true, returnDocument: "after", runValidators: true }
    );

    const baseUrl = tenantBaseUrl(req, tenant.primaryHostname, tenant.hostname);
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create(
      {
        payment_method_types: ["card"],
        line_items: order.items.map((item: Record<string, unknown>) => ({
          price_data: {
            currency: order.currency.toLowerCase(),
            unit_amount: Math.round(Number(item.totalMinor) / Number(item.quantity)),
            product_data: {
              name: String(item.nameSnapshot),
              images: item.imageSnapshot
                ? [normalizeImageUrl(String(item.imageSnapshot), `${baseUrl}/images/default_room_image.jpg`)]
                : undefined,
            },
          },
          quantity: Number(item.quantity),
        })),
        mode: "payment",
        success_url: `${baseUrl}/orders/${order._id}?payment=success`,
        cancel_url: `${baseUrl}/orders/${order._id}?payment=cancelled`,
        customer_email: order.customerSnapshot.email,
        client_reference_id: order._id.toString(),
        metadata: {
          kind: "generic_order",
          merchantId: tenant.merchantId,
          orderId: order._id.toString(),
          paymentId: payment._id.toString(),
        },
      },
      { idempotencyKey: `roomi-order-${order._id}` }
    );

    payment.providerSessionId = session.id;
    await payment.save();
    order.paymentStatus = "pending";
    await order.save();
    return NextResponse.json({ id: session.id, url: session.url });
  }
);

export const stripeCheckoutSession = catchAsyncErrors(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    await dbConnect({ throwOnError: true });
    const tenant = await requireTenantContext(req);
    const { searchParams } = new URL(req.url);

    const { checkInDate, checkOutDate, daysOfStay } = parseStayDates(
      searchParams.get("checkInDate"),
      searchParams.get("checkOutDate")
    );
    const roomId = requireObjectId(params?.id, "room ID");

    const room = await Room.findOne(tenantFilter(tenant, { _id: roomId })).lean().exec();

    if (!room) {
      throw new ErrorHandler("Room not found", 404);
    }

    const conflictingBooking = await Booking.exists(tenantFilter(tenant, {
      room: room._id,
      checkInDate: { $lt: checkOutDate },
      checkOutDate: { $gt: checkInDate },
    }));
    if (conflictingBooking) {
      throw new ErrorHandler("Room is not available for these dates", 409);
    }

    const totalAmount = room.pricePerNight * daysOfStay;
    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      throw new ErrorHandler("Invalid room price", 400);
    }

    const baseUrl = tenantBaseUrl(req, tenant.primaryHostname, tenant.hostname);
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
        merchantId: tenant.merchantId,
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

    if (session.metadata?.kind === "generic_order") {
      const merchantId = requireObjectId(session.metadata.merchantId, "merchant ID");
      const orderId = requireObjectId(session.metadata.orderId, "order ID");
      const paymentId = requireObjectId(session.metadata.paymentId, "payment ID");
      const order = await Order.findOne({ _id: orderId, merchantId });
      if (!order) throw new ErrorHandler("Order not found for Stripe session", 404);
      if (session.amount_total !== order.totals.grandTotalMinor ||
          session.currency?.toUpperCase() !== order.currency.toUpperCase()) {
        throw new ErrorHandler("Stripe amount or currency does not match the order", 400);
      }

      const paymentIntent = requireString(session.payment_intent, "Payment intent");
      await Payment.updateOne(
        { _id: paymentId, merchantId, orderId },
        {
          $set: {
            status: "paid",
            providerSessionId: session.id,
            providerPaymentId: paymentIntent,
            paidAt: new Date(),
          },
        }
      );
      order.status = "confirmed";
      order.paymentStatus = "paid";
      await order.save();
      await Reservation.updateMany(
        { merchantId, orderId, status: "held" },
        { $set: { status: "confirmed" }, $unset: { holdExpiresAt: 1 } }
      );
      return NextResponse.json({ success: true });
    }

    const roomId = requireObjectId(session.client_reference_id, "room ID");
    const tenant = await requireTenantContext(req);
    const metadataMerchantId = session.metadata?.merchantId;
    const roomScope = metadataMerchantId
      ? { _id: roomId, merchantId: requireObjectId(metadataMerchantId, "merchant ID") }
      : tenantFilter(tenant, { _id: roomId });
    const room = await Room.findOne(roomScope).select({ pricePerNight: 1 }).lean().exec();
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

    const bookingScope = metadataMerchantId
      ? { merchantId: metadataMerchantId }
      : tenantFilter(tenant);
    const existingBooking = await Booking.exists({
      ...bookingScope,
      stripeSessionId: session.id,
    });
    if (existingBooking) {
      return NextResponse.json({ success: true, duplicate: true });
    }

    const conflictingBooking = await Booking.exists({
      ...bookingScope,
      room: room._id,
      checkInDate: { $lt: checkOutDate },
      checkOutDate: { $gt: checkInDate },
    });
    if (conflictingBooking) {
      throw new ErrorHandler("Room is no longer available for these dates", 409);
    }

    await Booking.findOneAndUpdate(
      { ...bookingScope, stripeSessionId: session.id },
      {
        $setOnInsert: {
          stripeSessionId: session.id,
          merchantId: metadataMerchantId || tenant.merchantId,
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
