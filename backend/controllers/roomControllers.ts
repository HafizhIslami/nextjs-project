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
