import { deleteRoomImage } from "@/backend/controllers/roomControllers";
import { NextRequest, NextResponse } from "next/server";
import { requireMerchantAdmin } from "@/backend/middlewares/routeAuth";

interface RequestContext {
    params: { id: string };
}

export async function PUT(request: NextRequest, ctx: RequestContext): Promise<NextResponse> {
    const auth = await requireMerchantAdmin(request);
    if (auth instanceof NextResponse) return auth;
    return await deleteRoomImage(request, ctx);
}
export const dynamic = "force-dynamic";
