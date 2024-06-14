import { NextRequest, NextResponse } from "next/server";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors";
import Booking, { IBooking } from "../models/booking";
import Moment from "moment";
import { extendMoment } from "moment-range";

const moment = extendMoment(Moment);
// Create new room booking  => /api/
export const newBooking = catchAsyncErrors(async (req: NextRequest) => {
  const body = await req.json();
  const {
    room,
    checkInDate,
    checkOutDate,
    daysOfStay,
    amountPaid,
    paymentInfo,
  } = body;

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

// Check room availability  => /api/bookings/check
export const checkRoomBookingAvailability = catchAsyncErrors(
  async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get("roomId");

    const checkInDate: Date = new Date(
      searchParams.get("checkInDate") as string
    );
    const checkOutDate: Date = new Date(
      searchParams.get("checkOutDate") as string
    );

    const bookings: IBooking[] = await Booking.find({
      room: roomId,
      $and: [
        { checkInDate: { $lte: checkOutDate } },
        { checkOutDate: { $gte: checkInDate } },
      ],
    });

    const isAvailable: boolean = bookings.length === 0;

    return NextResponse.json({ isAvailable });
  }
);

export const getRoomBookedDates = catchAsyncErrors(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get("roomId");

  const bookings = await Booking.find({ room: roomId });
  console.log(bookings);
  const bookedDates = bookings.flatMap((booking) =>
    Array.from(
      moment
        .range(moment(booking.checkInDate), moment(booking.checkOutDate))
        .by("day")
    )
  );

  return NextResponse.json({ bookedDates });
});
