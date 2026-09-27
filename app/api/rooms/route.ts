import { allRooms, newRoom } from "@/backend/controllers/roomControllers";
import { requireMerchantAdmin } from "@/backend/middlewares/routeAuth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
    return await allRooms(request, { params: { entries: "6" } });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    const auth = await requireMerchantAdmin(request);
    if (auth instanceof NextResponse) return auth;
    return await newRoom(request, {});
}
export const dynamic = "force-dynamic";
