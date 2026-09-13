import { NextRequest, NextResponse } from "next/server";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors";
import Booking from "../models/booking";
import Moment from "moment";
import { extendMoment } from "moment-range";
import ErrorHandler from "../utils/errorHandler";
import dbConnect from "../config/dbConnect";

const moment = extendMoment(Moment);
// Create new room booking  => /api/
export const newBooking = catchAsyncErrors(async (req: NextRequest) => {
  await dbConnect({ throwOnError: true });
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
    await dbConnect({ throwOnError: true });
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get("roomId");

    const checkInDate: Date = new Date(
      searchParams.get("checkInDate") as string
    );
    const checkOutDate: Date = new Date(
      searchParams.get("checkOutDate") as string
    );

    const bookings = await Booking.find({
      room: roomId,
      $and: [
        { checkInDate: { $lte: checkOutDate } },
        { checkOutDate: { $gte: checkInDate } },
      ],
    }).select({ _id: 1 }).lean().exec();

    const isAvailable: boolean = bookings.length === 0;

    return NextResponse.json({ isAvailable });
  }
);

// Check room booked dates  => /api/bookings/booked_dates
export const getRoomBookedDates = catchAsyncErrors(async (req: NextRequest) => {
  await dbConnect({ throwOnError: true });
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get("roomId");

  const bookings = await Booking.find({ room: roomId })
    .select({ checkInDate: 1, checkOutDate: 1 })
    .lean()
    .exec();
  const bookedDates = bookings.flatMap((booking) =>
    Array.from(
      moment
        .range(moment(booking.checkInDate), moment(booking.checkOutDate))
        .by("day")
    )
  );

  return NextResponse.json({ bookedDates });
});

// Check current user bookings  => /api/bookings/me
export const myBookings = catchAsyncErrors(async (req: NextRequest) => {
  await dbConnect({ throwOnError: true });
  const bookings = await Booking.find({ user: req.user._id })
    .populate("room")
    .lean()
    .exec();

  return NextResponse.json({ bookings });
});

// Get booking details  => /api/bookings/:id
export const getBookingDetails = catchAsyncErrors(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    await dbConnect({ throwOnError: true });
    const booking = await Booking.findById(params.id)
      .populate("user room")
      .lean()
      .exec();

    if (!booking) {
      throw new ErrorHandler("Booking not found", 404);
    }

    if (
      booking.user?._id?.toString() !== req.user._id?.toString() &&
      req?.user?.role !== "admin"
    ) {
      throw new ErrorHandler("You can not view this booking", 403);
    }
    return NextResponse.json({ booking });
  }
);

const getLastSixMonthsSales = async () => {
  const currentDate = moment();
  const rangeStart = moment(currentDate).subtract(5, "months").startOf("month");
  const rangeEnd = moment(currentDate).endOf("month");
  const sales = await Booking.aggregate([
    { $match: { createdAt: { $gte: rangeStart.toDate(), $lte: rangeEnd.toDate() } } },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        totalSales: { $sum: "$amountPaid" },
        numOfBookings: { $sum: 1 },
      },
    },
  ]);

  return Array.from({ length: 6 }, (_, index) => {
    const month = moment(currentDate).subtract(index, "months");
    const summary = sales.find(
      (item) => item._id.year === month.year() && item._id.month === month.month() + 1
    );

    return {
      monthName: month.format("MMMM"),
      totalSales: summary?.totalSales ?? 0,
      numOfBookings: summary?.numOfBookings ?? 0,
    };
  });
};

const getTopPerformingRooms = async (startDate: Date, endDate: Date) => {
  const topRooms = await Booking.aggregate([
    // Stage 1: Filter documents within start and end date
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    // Stage 2: Group documents by room
    {
      $group: {
        _id: "$room",
        bookingsCount: { $sum: 1 },
      },
    },

    // Stage 3: Sort documents by bookingsCount in descending order
    {
      $sort: { bookingsCount: -1 },
    },
    // Stage 4: Limit the documents
    {
      $limit: 3,
    },
    // Stage 5: Retrieve additional data from rooms collection like room name
    {
      $lookup: {
        from: "rooms",
        localField: "_id",
        foreignField: "_id",
        as: "roomData",
      },
    },
    // Stage 6: Takes roomData and deconstructs into documents
    {
      $unwind: "$roomData",
    },
    // Stage 7: Shape the output document (include or exclude the fields)
    {
      $project: {
        _id: 0,
        roomName: "$roomData.name",
        bookingsCount: 1,
      },
    },
  ]);

  return topRooms;
};

// Get sales statistic  => /api/admin/sales_stats?startDate=...&endDate=...
export const getSalesStats = catchAsyncErrors(async (req: NextRequest) => {
  await dbConnect({ throwOnError: true });
  const { searchParams } = new URL(req.url);
  const startDate = new Date(searchParams.get("startDate") as string);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(searchParams.get("endDate") as string);
  endDate.setHours(23, 59, 59, 999);

  const [summary, sixMonthSalesData, topThreeRooms] = await Promise.all([
    Booking.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: null,
          numberOfBookings: { $sum: 1 },
          totalSales: { $sum: "$amountPaid" },
        },
      },
    ]),
    getLastSixMonthsSales(),
    getTopPerformingRooms(startDate, endDate),
  ]);

  const numberOfBookings = summary[0]?.numberOfBookings ?? 0;
  const totalSales = summary[0]?.totalSales ?? 0;

  return NextResponse.json({
    topThreeRooms,
    sixMonthSalesData,
    numberOfBookings,
    totalSales,
  });
});

// Get admin bookings   =>  /api/admin/bookings
export const allAdminBookings = catchAsyncErrors(async () => {
  await dbConnect({ throwOnError: true });
  const bookings = await Booking.find().populate("user room").lean().exec();

  return NextResponse.json({
    bookings,
  });
});

// Delete booking   =>  /api/admin/bookings/:id
export const deleteBooking = catchAsyncErrors(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    await dbConnect({ throwOnError: true });
    const booking = await Booking.findById(params.id);

    if (!booking) {
      throw new ErrorHandler("Booking not found with this ID", 404);
    }

    await booking?.deleteOne();

    return NextResponse.json({
      success: true,
    });
  }
);
