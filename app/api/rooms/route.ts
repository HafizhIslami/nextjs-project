import { allRooms, newRoom } from "@/backend/controllers/roomControllers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
    return allRooms(request, { params: { entries: "6" } });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    return newRoom(request, {});
}
