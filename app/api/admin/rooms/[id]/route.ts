import { deleteRoom, updateRoom } from "@/backend/controllers/roomControllers";
import { NextRequest, NextResponse } from "next/server";

interface RequestContext {
    params: { id: string };
}

export async function PUT(request: NextRequest, ctx: RequestContext): Promise<NextResponse> {
    return await updateRoom(request, ctx);
}

export async function DELETE(request: NextRequest, ctx: RequestContext): Promise<NextResponse> {
    return await deleteRoom(request, ctx);
}
export const dynamic = "force-dynamic";
