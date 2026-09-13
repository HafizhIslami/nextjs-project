import { getRoomDetail } from "@/backend/controllers/roomControllers";
import { NextRequest, NextResponse } from "next/server";

interface RequestContext {
    params: {
        id: string;
    };
}

export async function GET(request: NextRequest, ctx: RequestContext): Promise<NextResponse> {
    return getRoomDetail(request, ctx);
}
