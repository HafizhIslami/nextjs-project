import { NextRequest, NextResponse } from "next/server";
import Room, { IImage, IReview } from "../models/room";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors";
import APIFilters from "../utils/apiFilters";
import ErrorHandler from "../utils/errorHandler";
import Booking from "../models/booking";
import { URL } from "url";
import { delete_file, upload_file } from "../utils/cloudinary";
import dbConnect from "../config/dbConnect";
import {
  requireImageDataUrl,
  requireObjectId,
  requireString,
} from "../utils/validation";

const getRoomInput = (body: unknown) => {
  if (!body || typeof body !== "object") {
    throw new ErrorHandler("Invalid room payload", 400);
  }

  const input = body as Record<string, unknown>;
  const pricePerNight = Number(input.pricePerNight);
  const guestCapacity = Number(input.guestCapacity);
  const numOfBeds = Number(input.numOfBeds);

  if (!Number.isFinite(pricePerNight) || pricePerNight < 0) {
    throw new ErrorHandler("Invalid room price", 400);
  }
  if (!Number.isInteger(guestCapacity) || guestCapacity < 1) {
    throw new ErrorHandler("Invalid guest capacity", 400);
  }
  if (!Number.isInteger(numOfBeds) || numOfBeds < 1) {
    throw new ErrorHandler("Invalid number of beds", 400);
  }

  const category = input.category;
  if (category !== "King" && category !== "Single" && category !== "Twins") {
    throw new ErrorHandler("Invalid room category", 400);
  }

  return {
    name: requireString(input.name, "Room name", 200),
    description: requireString(input.description, "Room description", 10000),
    pricePerNight,
    address: requireString(input.address, "Room address", 500),
    category,
    guestCapacity,
    numOfBeds,
    isInternet: input.isInternet === true,
    isBreakfast: input.isBreakfast === true,
    isAirConditioned: input.isAirConditioned === true,
    isPetsAllowed: input.isPetsAllowed === true,
    isRoomCleaning: input.isRoomCleaning === true,
  };
};

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
  const room = await Room.create({
    ...getRoomInput(body),
    user: req.user._id,
  });

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
    requireObjectId(params?.id, "room ID");
    const room = await Room.findById(params.id);
    const body = await req.json();

    if (!room) {
      return NextResponse.json({ message: "Room not found" }, { status: 404 });
    }

    room.set(getRoomInput(body));
    await room.save();

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
    if (images.length === 0 || images.length > 10) {
      throw new ErrorHandler("Upload between 1 and 10 images", 400);
    }

    const validatedImages = images.map((image: unknown, index: number) =>
      requireImageDataUrl(image, `Image ${index + 1}`)
    );
    const urls = await Promise.all(validatedImages.map(uploader));

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

    const imageId = requireString(body?.imgId, "Image ID", 300);
    const imageExists = room.images.some(
      (image: IImage) => image.public_id === imageId
    );
    if (!imageExists) {
      throw new ErrorHandler("Image not found in this room", 404);
    }

    const isDeleted = await delete_file(imageId);

    if (isDeleted) {
      room.images = room?.images.filter(
        (img: IImage) => img.public_id !== imageId
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
  const roomId = requireObjectId(body?.roomId, "room ID");
  const rating = Number(body?.rating);
  const comment = requireString(body?.comment, "Review comment", 2000);

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new ErrorHandler("Rating must be between 1 and 5", 400);
  }

  const completedBooking = await Booking.exists({
    user: req.user._id,
    room: roomId,
    checkOutDate: { $lt: new Date() },
  });
  if (!completedBooking) {
    throw new ErrorHandler("You can only review a completed booking", 403);
  }

  const review = {
    user: req.user._id,
    rating,
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
      if (review.user?.toString() === req?.user?._id?.toString()) {
        review.comment = comment;
        review.rating = rating;
      }
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
  const roomId = requireObjectId(searchParams.get("roomId"), "room ID");
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

  const roomId = requireObjectId(searchParams.get("roomId"), "room ID");
  const room = await Room.findById(roomId)
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

  const roomId = requireObjectId(searchParams.get("roomId"), "room ID");
  const reviewId = requireObjectId(searchParams.get("id"), "review ID");

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
