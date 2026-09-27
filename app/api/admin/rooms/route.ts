import { getAllRoomAdmin, newRoom } from "@/backend/controllers/roomControllers";
import { NextRequest, NextResponse } from "next/server";
import { requireMerchantAdmin } from "@/backend/middlewares/routeAuth";

export async function GET(request: NextRequest): Promise<NextResponse> {
    const auth = await requireMerchantAdmin(request);
    if (auth instanceof NextResponse) return auth;
    return await getAllRoomAdmin(request, {});
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    const auth = await requireMerchantAdmin(request);
    if (auth instanceof NextResponse) return auth;
    return await newRoom(request, {});
}
export const dynamic = "force-dynamic";
