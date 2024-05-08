import { NextRequest, NextResponse } from "next/server";
import Room, { IRoom } from "../models/room";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors";

export const allRooms = catchAsyncErrors(async (req: NextRequest) => {
  const resPerPage = 4;
  const room = await Room.find();

  const queryStr: any = {};
  const { searchParams } = new URL(req.url);
  searchParams.forEach((val, key) => {
    queryStr[key] = val;
  });

  const count = await Room.countDocuments();

  const apiFilters = new APIFilters(Room, queryStr);
  let rooms: IRoom[] = await apiFilters.query;
  const filteredRoomsCount = rooms.length;

  apiFilters.pagination(resPerPage);
  rooms = await apiFilters.query;

  return NextResponse.json({
    success: true,
    count,
    filteredRoomsCount,
    resPerPage,
    room,
  });
});

export const newRoom = catchAsyncErrors(async (req: NextRequest) => {
  const body = await req.json();
  const room = await Room.create(body);

  return NextResponse.json({
    success: true,
    room,
  });
});

export const getRoomDetail = catchAsyncErrors(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const room = await Room.findById(params.id);

    if (!room) {
      return NextResponse.json({ message: "Room not found" }, { status: 404 });
    }
    return NextResponse.json({
      success: true,
      room,
    });
  }
);

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
