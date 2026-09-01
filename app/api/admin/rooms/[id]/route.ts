import { deleteRoom, updateRoom } from "@/backend/controllers/roomControllers";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest): Promise<NextResponse> {
    return updateRoom(request, {});
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
    return deleteRoom(request, {});
}
