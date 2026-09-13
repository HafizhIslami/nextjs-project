import { NextRequest, NextResponse } from "next/server";
import Room, { IImage, IReview } from "../models/room";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors";
import APIFilters from "../utils/apiFilters";
import ErrorHandler from "../utils/errorHandler";
import Booking from "../models/booking";
import { URL } from "url";
import { delete_file, upload_file } from "../utils/cloudinary";
import dbConnect from "../config/dbConnect";

// still have a problem in allRooms at rooms
export const allRooms = catchAsyncErrors(
  async (req: NextRequest) => {
    await dbConnect({ throwOnError: true });
    const resPerPage: number = /*Number(params.entries) ||*/ 6;
    const queryStr: Record<string, string> = {};
    const { searchParams } = new URL(req.url);

    searchParams.forEach((val, key) => {
      queryStr[key] = val;
    });

    const roomsCountPromise = Room.countDocuments().exec();
    const apiFilters = new APIFilters(Room.find(), queryStr).search().filter();
    const filteredRoomsCountPromise = apiFilters.query.clone().countDocuments().exec();

    apiFilters.pagination(resPerPage);
    const [roomsCount, filteredRoomsCount, rooms] = await Promise.all([
      roomsCountPromise,
      filteredRoomsCountPromise,
      apiFilters.query.clone().lean().exec(),
    ]);

    return NextResponse.json({
      success: true,
      roomsCount,
      filteredRoomsCount,
      resPerPage,
      rooms,
    });
  }
);

// Create new room => /api/admin/rooms/:id
export const newRoom = catchAsyncErrors(async (req: NextRequest) => {
  await dbConnect({ throwOnError: true });
  const body = await req.json();
  body.user = req.user._id;
  const room = await Room.create(body);

  return NextResponse.json({
    success: true,
    room,
  });
});

// Get room details => /api/rooms/:id
export const getRoomDetail = catchAsyncErrors(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    await dbConnect({ throwOnError: true });
    const room = await Room.findById(params.id)
      .populate("reviews.user")
      .lean()
      .exec();

    if (!room) {
      throw new ErrorHandler("Room not found", 404);
    }
    return NextResponse.json({
      success: true,
      room,
    });
  }
);

// Update room details => /api/admin/rooms/:id
export const updateRoom = catchAsyncErrors(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    await dbConnect({ throwOnError: true });
    let room = await Room.findById(params.id);
    const body = await req.json();

    if (!room) {
      return NextResponse.json({ message: "Room not found" }, { status: 404 });
    }

    room = await Room.findByIdAndUpdate(params.id, body, {
      new: true,
    });

    return NextResponse.json({
      success: true,
      room,
    });
  }
);

// Upload room images  =>  /api/admin/rooms/:id/upload_images
export const uploadRoomImages = catchAsyncErrors(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    await dbConnect({ throwOnError: true });
    const room = await Room.findById(params.id);
    const body = await req.json();

    if (!room) {
      throw new ErrorHandler("Room not found", 404);
    }

    const uploader = async (image: string) =>
      upload_file(image, "bookit/rooms");

    const images = Array.isArray(body?.images) ? body.images : [];
    const urls = await Promise.all(images.map(uploader));

    room?.images?.push(...urls);

    await room.save();

    return NextResponse.json({
      success: true,
      room,
    });
  }
);

// Delete room image  =>  /api/admin/rooms/:id/delete_image
export const deleteRoomImage = catchAsyncErrors(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    await dbConnect({ throwOnError: true });
    const room = await Room.findById(params.id);
    const body = await req.json();

    if (!room) {
      throw new ErrorHandler("Room not found", 404);
    }

    const isDeleted = await delete_file(body?.imgId);

    if (isDeleted) {
      room.images = room?.images.filter(
        (img: IImage) => img.public_id !== body.imgId
      );
    }

    await room.save();

    return NextResponse.json({
      success: true,
      room,
    });
  }
);

// Delete room => /api/admin/rooms/:id
export const deleteRoom = catchAsyncErrors(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    await dbConnect({ throwOnError: true });
    const room = await Room.findById(params.id);

    if (!room) {
      return NextResponse.json({ message: "Room not found" }, { status: 404 });
    }

    await room.deleteOne();

    return NextResponse.json({
      success: true,
    });
  }
);

// Create room review => /api/reviews
export const createRoomReview = catchAsyncErrors(async (req: NextRequest) => {
  await dbConnect({ throwOnError: true });
  const body = await req.json();
  const { rating, comment, roomId } = body;

  const review = {
    user: req.user._id,
    rating: Number(rating),
    comment,
  };

  const room = await Room.findById(roomId);
  if (!room) {
    throw new ErrorHandler("Room not found", 404);
  }
  const isReviewed = room?.reviews?.find(
    (r: IReview) => r.user?.toString() === req.user._id?.toString()
  );

  if (isReviewed) {
    room?.reviews?.forEach((review: IReview) => {
      if (review.user?.toString() === req?.user?._id?.toString())
        review.comment = comment;
      review.rating = rating;
    });
  } else {
    room.reviews.push(review);
    room.numOfReviews = room.reviews.length;
  }

  room.ratings =
    room?.reviews?.reduce(
      (acc: number, item: { rating: number }) => item.rating + acc,
      0
    ) / room?.reviews?.length;

  await room.save();

  return NextResponse.json({
    success: true,
  });
});

// Check room's review allowance => /api/review/allow_review
export const getAllowReview = catchAsyncErrors(async (request: NextRequest) => {
  await dbConnect({ throwOnError: true });
  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get("roomId");
  const bookings = await Booking.find({
    user: request.user._id,
    room: roomId,
  }).select({ checkOutDate: 1 }).lean().exec();

  const allowReview = bookings.find(
    (booking) => booking.checkOutDate < Date.now()
  );
  // const allowReview = bookings.length > 0 ? true : false;
  return NextResponse.json({
    allowReview,
  });
});

// Get all room - ADMIN => /api/admin/rooms
export const getAllRoomAdmin = catchAsyncErrors(
  async () => {
    await dbConnect({ throwOnError: true });
    const rooms = await Room.find().lean().exec();

    return NextResponse.json({
      rooms,
    });
  }
);

// Get room reviews - ADMIN  =>  /api/admin/rooms/reviews
export const getRoomReviews = catchAsyncErrors(async (req: NextRequest) => {
  await dbConnect({ throwOnError: true });
  const { searchParams } = new URL(req.url);

  const room = await Room.findById(searchParams.get("roomId"))
    .select({ reviews: 1 })
    .lean()
    .exec();

  if (!room) {
    throw new ErrorHandler("Room not found", 404);
  }

  return NextResponse.json({
    reviews: room.reviews,
  });
});

// Delete room review - ADMIN  =>  /api/admin/rooms/reviews
export const deleteRoomReview = catchAsyncErrors(async (req: NextRequest) => {
  await dbConnect({ throwOnError: true });
  const { searchParams } = new URL(req.url);

  const roomId = searchParams.get("roomId");
  const reviewId = searchParams.get("id");

  const room = await Room.findById(roomId).select({ reviews: 1 }).lean().exec();

  if (!room) {
    throw new ErrorHandler("Room not found", 404);
  }

  const reviews = room.reviews.filter((review: IReview) => {
    const id = review._id?.toString();
    return id !== reviewId;
  });
  const numOfReviews = reviews.length;

  const ratings =
    numOfReviews === 0
      ? 0
      : reviews.reduce(
          (acc: number, item: { rating: number }) => item.rating + acc,
          0
        ) / numOfReviews;

  await Room.findByIdAndUpdate(roomId, { reviews, numOfReviews, ratings });

  return NextResponse.json({
    success: true,
  });
});
