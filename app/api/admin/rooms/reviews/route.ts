import { deleteRoomReview, getRoomReviews } from "@/backend/controllers/roomControllers";
import { NextRequest, NextResponse } from "next/server";
import { requireMerchantAdmin } from "@/backend/middlewares/routeAuth";

export async function GET(request: NextRequest): Promise<NextResponse> {
    const auth = await requireMerchantAdmin(request);
    if (auth instanceof NextResponse) return auth;
    return await getRoomReviews(request, {});
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
    const auth = await requireMerchantAdmin(request);
    if (auth instanceof NextResponse) return auth;
    return await deleteRoomReview(request, {});
}
export const dynamic = "force-dynamic";
