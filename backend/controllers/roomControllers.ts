import { NextRequest, NextResponse } from "next/server";
import Room, { IRoom } from "../models/room";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors";
import APIFilters from "../utils/apiFilters";

// still have a problem in allRooms at rooms
export const allRooms = catchAsyncErrors(async (req: NextRequest) => {
  const resPerPage: number = 3;

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
