import { checkRoomBookingAvailability } from "@/backend/controllers/bookingControllers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
  return checkRoomBookingAvailability(request, {});
}
