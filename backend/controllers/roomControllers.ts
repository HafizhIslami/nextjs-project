import { NextRequest, NextResponse } from "next/server";
import Room, { IImage, IReview, IRoom } from "../models/room";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors";
import APIFilters from "../utils/apiFilters";
import ErrorHandler from "../utils/errorHandler";
import Booking from "../models/booking";
import { URL } from "url";
import { delete_file, upload_file } from "../utils/cloudinary";

// still have a problem in allRooms at rooms
export const allRooms = catchAsyncErrors(
  async (req: NextRequest, { params }: { params: { entries: string } }) => {
    const resPerPage: number = /*Number(params.entries) ||*/ 6;
    const queryStr: any = {};
    const { searchParams } = new URL(req.url);

    searchParams.forEach((val, key) => {
      queryStr[key] = val;
    });
    const roomsCount = await Room.countDocuments();

    const apiFilters = new APIFilters(Room, queryStr).search().filter();
    let rooms: IRoom[] = await apiFilters.query;
    const filteredRoomsCount: number = rooms.length;

    apiFilters.pagination(resPerPage);
    rooms = await apiFilters.query.clone();

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
    const room = await Room.findById(params.id).populate("reviews.user");

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
    const room = await Room.findById(params.id);
    const body = await req.json();

    if (!room) {
      throw new ErrorHandler("Room not found", 404);
    }

    const uploader = async (image: string) =>
      upload_file(image, "bookit/rooms");

    const urls = await Promise.all((body?.images).map(uploader));

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
  const body = await req.json();
  const { rating, comment, roomId } = body;

  const review = {
    user: req.user._id,
    rating: Number(rating),
    comment,
  };

  const room = await Room.findById(roomId);
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
  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get("roomId");
  const bookings = await Booking.find({
    user: request.user._id,
    room: roomId,
  });

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
  async (request: NextRequest) => {
    const rooms = await Room.find();

    return NextResponse.json({
      rooms,
    });
  }
);

// Get room reviews - ADMIN  =>  /api/admin/rooms/reviews
export const getRoomReviews = catchAsyncErrors(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);

  const room = await Room.findById(searchParams.get("roomId"));

  return NextResponse.json({
    reviews: room.reviews,
  });
});

// Delete room review - ADMIN  =>  /api/admin/rooms/reviews
export const deleteRoomReview = catchAsyncErrors(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);

  const roomId = searchParams.get("roomId");
  const reviewId = searchParams.get("id");

  const room = await Room.findById(roomId);

  const reviews = room.reviews.filter(
    (review: IReview) => (review?._id as string).toString() !== reviewId
  );
  const numOfReviews = reviews.length;

  const ratings =
    numOfReviews === 0
      ? 0
      : room?.reviews?.reduce(
          (acc: number, item: { rating: number }) => item.rating + acc,
          0
        ) / numOfReviews;

  await Room.findByIdAndUpdate(roomId, { reviews, numOfReviews, ratings });

  return NextResponse.json({
    success: true,
  });
});
