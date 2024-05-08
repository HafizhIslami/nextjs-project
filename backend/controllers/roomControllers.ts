import { NextRequest, NextResponse } from "next/server";
import Room from "../models/room";

export const allRooms = async function GET(request: NextRequest) {
  const resPerPage = 8;
  const room = await Room.find();

  return NextResponse.json({
    success: true,
    resPerPage,
    count: room.length,
    room,
  });
};

export const newRoom = async (req: NextRequest) => {
  const body = await req.json();
  const room = await Room.create(body);

  return NextResponse.json({
    success: true,
    room,
  });
};

export const getRoomDetail = async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const room = await Room.findById(params.id);

  if (!room) {
    return NextResponse.json({ message: "Room not found" }, { status: 404 });
  }
  return NextResponse.json({
    success: true,
    room,
  });
};

export const updateRoom = async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
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
};

export const deleteRoom = async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const room = await Room.findById(params.id);

  if (!room) {
    return NextResponse.json({ message: "Room not found" }, { status: 404 });
  }

  await room.deleteOne();

  return NextResponse.json({
    success: true,
  });
};
