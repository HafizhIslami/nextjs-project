import { NextRequest, NextResponse } from "next/server";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors";
import Booking from "../models/booking";
import Moment from "moment";
import { extendMoment } from "moment-range";
import ErrorHandler from "../utils/errorHandler";
import dbConnect from "../config/dbConnect";
import { requireDate, requireObjectId, parseStayDates } from "../utils/validation";
import { requireTenantContext } from "../tenancy/requestTenant";
import { tenantAggregateMatch, tenantFilter } from "../tenancy/scope";
import type { TenantContext } from "../tenancy/tenantContext";
import { Order } from "../models/commerce";

const moment = extendMoment(Moment);
// Create new room booking  => /api/
export const newBooking = catchAsyncErrors(async () => {
  throw new ErrorHandler(
    "Direct booking is disabled. Complete payment through Stripe Checkout.",
    410
  );
});

// Check room availability  => /api/bookings/check
export const checkRoomBookingAvailability = catchAsyncErrors(
  async (req: NextRequest) => {
    await dbConnect({ throwOnError: true });
    const tenant = await requireTenantContext(req);
    const { searchParams } = new URL(req.url);
    const roomId = requireObjectId(searchParams.get("roomId"), "room ID");
    const { checkInDate, checkOutDate } = parseStayDates(
      searchParams.get("checkInDate"),
      searchParams.get("checkOutDate")
    );

    const bookings = await Booking.find(tenantFilter(tenant, {
      room: roomId,
      $and: [
        { checkInDate: { $lt: checkOutDate } },
        { checkOutDate: { $gt: checkInDate } },
      ],
    })).select({ _id: 1 }).lean().exec();

    const isAvailable: boolean = bookings.length === 0;

    return NextResponse.json({ isAvailable });
  }
);

// Check room booked dates  => /api/bookings/booked_dates
export const getRoomBookedDates = catchAsyncErrors(async (req: NextRequest) => {
  await dbConnect({ throwOnError: true });
  const tenant = await requireTenantContext(req);
  const { searchParams } = new URL(req.url);
  const roomId = requireObjectId(searchParams.get("roomId"), "room ID");

  const bookings = await Booking.find(tenantFilter(tenant, { room: roomId }))
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
  const tenant = await requireTenantContext(req);
  const bookings = await Booking.find(tenantFilter(tenant, { user: req.user._id }))
    .populate("room")
    .lean()
    .exec();

  return NextResponse.json({ bookings });
});

// Get booking details  => /api/bookings/:id
export const getBookingDetails = catchAsyncErrors(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    await dbConnect({ throwOnError: true });
    const tenant = await requireTenantContext(req);
    requireObjectId(params?.id, "booking ID");
    const booking = await Booking.findOne(tenantFilter(tenant, { _id: params.id }))
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

const getLastSixMonthsSales = async (tenant: TenantContext) => {
  const currentDate = moment();
  const rangeStart = moment(currentDate).subtract(5, "months").startOf("month");
  const rangeEnd = moment(currentDate).endOf("month");
  const sales = await Booking.aggregate([
    {
      $match: {
        ...tenantAggregateMatch(tenant),
        createdAt: { $gte: rangeStart.toDate(), $lte: rangeEnd.toDate() },
      },
    },
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

const getTopPerformingRooms = async (
  tenant: TenantContext,
  startDate: Date,
  endDate: Date
) => {
  const topRooms = await Booking.aggregate([
    // Stage 1: Filter documents within start and end date
    {
      $match: {
        ...tenantAggregateMatch(tenant),
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

const getCommerceStats = async (
  tenant: TenantContext,
  startDate: Date,
  endDate: Date
) => {
  const currentDate = moment();
  const rangeStart = moment(currentDate).subtract(5, "months").startOf("month").toDate();
  const rangeEnd = moment(currentDate).endOf("month").toDate();
  const amountDivisor = tenant.currency === "IDR" ? 1 : 100;

  const [summary, monthly, topOfferings] = await Promise.all([
    Order.aggregate([
      {
        $match: {
          ...tenantAggregateMatch(tenant),
          status: { $ne: "cancelled" },
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      { $group: { _id: null, count: { $sum: 1 }, totalMinor: { $sum: "$totals.grandTotalMinor" } } },
    ]),
    Order.aggregate([
      {
        $match: {
          ...tenantAggregateMatch(tenant),
          status: { $ne: "cancelled" },
          createdAt: { $gte: rangeStart, $lte: rangeEnd },
        },
      },
      {
        $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          totalMinor: { $sum: "$totals.grandTotalMinor" },
          count: { $sum: 1 },
        },
      },
    ]),
    Order.aggregate([
      {
        $match: {
          ...tenantAggregateMatch(tenant),
          status: { $ne: "cancelled" },
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.offeringId",
          roomName: { $first: "$items.nameSnapshot" },
          bookingsCount: { $sum: "$items.quantity" },
        },
      },
      { $sort: { bookingsCount: -1 } },
      { $limit: 3 },
      { $project: { _id: 0, roomName: 1, bookingsCount: 1 } },
    ]),
  ]);

  return {
    count: summary[0]?.count ?? 0,
    totalSales: (summary[0]?.totalMinor ?? 0) / amountDivisor,
    sixMonthSalesData: Array.from({ length: 6 }, (_, index) => {
      const month = moment(currentDate).subtract(index, "months");
      const value = monthly.find(
        (item) => item._id.year === month.year() && item._id.month === month.month() + 1
      );
      return {
        monthName: month.format("MMMM"),
        totalSales: (value?.totalMinor ?? 0) / amountDivisor,
        numOfBookings: value?.count ?? 0,
      };
    }),
    topOfferings,
  };
};

// Get sales statistic  => /api/admin/sales_stats?startDate=...&endDate=...
export const getSalesStats = catchAsyncErrors(async (req: NextRequest) => {
  await dbConnect({ throwOnError: true });
  const tenant = await requireTenantContext(req);
  const { searchParams } = new URL(req.url);
  const startDate = requireDate(searchParams.get("startDate"), "start date");
  startDate.setHours(0, 0, 0, 0);
  const endDate = requireDate(searchParams.get("endDate"), "end date");
  endDate.setHours(23, 59, 59, 999);

  if (endDate < startDate) {
    throw new ErrorHandler("End date must be after start date", 400);
  }

  const [summary, sixMonthSalesData, topThreeRooms, commerce] = await Promise.all([
    Booking.aggregate([
      {
        $match: {
          ...tenantAggregateMatch(tenant),
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: null,
          numberOfBookings: { $sum: 1 },
          totalSales: { $sum: "$amountPaid" },
        },
      },
    ]),
    getLastSixMonthsSales(tenant),
    getTopPerformingRooms(tenant, startDate, endDate),
    getCommerceStats(tenant, startDate, endDate),
  ]);

  const numberOfBookings = (summary[0]?.numberOfBookings ?? 0) + commerce.count;
  const totalSales = (summary[0]?.totalSales ?? 0) + commerce.totalSales;
  const combinedMonthly = sixMonthSalesData.map((month, index) => ({
    ...month,
    totalSales: month.totalSales + commerce.sixMonthSalesData[index].totalSales,
    numOfBookings: month.numOfBookings + commerce.sixMonthSalesData[index].numOfBookings,
  }));
  const topPerformers = [...topThreeRooms, ...commerce.topOfferings]
    .sort((a, b) => b.bookingsCount - a.bookingsCount)
    .slice(0, 3);

  return NextResponse.json({
    topThreeRooms: topPerformers,
    sixMonthSalesData: combinedMonthly,
    numberOfBookings,
    totalSales,
    currency: tenant.currency,
  });
});

// Get admin bookings   =>  /api/admin/bookings
export const allAdminBookings = catchAsyncErrors(async (request: NextRequest) => {
  await dbConnect({ throwOnError: true });
  const tenant = await requireTenantContext(request);
  const bookings = await Booking.find(tenantFilter(tenant))
    .populate("user room")
    .lean()
    .exec();

  return NextResponse.json({
    bookings,
  });
});

// Delete booking   =>  /api/admin/bookings/:id
export const deleteBooking = catchAsyncErrors(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    await dbConnect({ throwOnError: true });
    const tenant = await requireTenantContext(req);
    requireObjectId(params?.id, "booking ID");
    const booking = await Booking.findOne(tenantFilter(tenant, { _id: params.id }));

    if (!booking) {
      throw new ErrorHandler("Booking not found with this ID", 404);
    }

    await booking?.deleteOne();

    return NextResponse.json({
      success: true,
    });
  }
);
