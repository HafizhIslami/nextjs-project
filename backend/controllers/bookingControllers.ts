import { NextRequest, NextResponse } from "next/server";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors";
import Booking from "../models/booking";
import user from "../models/user";

export const newBooking = catchAsyncErrors(async (req: NextRequest) => {
  const body = await req.json();
  const { room, checkInDate, checkOutDate, daysOfStay, amountPaid, paymentInfo } = body;

  const booking = await Booking.create({
    room,
    checkInDate,
    checkOutDate,
    daysOfStay,
    amountPaid,
    paymentInfo,
    user: req.user._id,
    paidAt: Date.now(),
  });

  return NextResponse.json({ booking });
});
