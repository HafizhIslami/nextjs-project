import { deleteRoom, updateRoom } from "@/backend/controllers/roomControllers";
import { requireMerchantAdmin } from "@/backend/middlewares/routeAuth";
import { NextRequest, NextResponse } from "next/server";

interface RequestContext {
    params: { id: string };
}

export async function PUT(request: NextRequest, ctx: RequestContext): Promise<NextResponse> {
    const auth = await requireMerchantAdmin(request);
    if (auth instanceof NextResponse) return auth;
    return await updateRoom(request, ctx);
}

export async function DELETE(request: NextRequest, ctx: RequestContext): Promise<NextResponse> {
    const auth = await requireMerchantAdmin(request);
    if (auth instanceof NextResponse) return auth;
    return await deleteRoom(request, ctx);
}
export const dynamic = "force-dynamic";
