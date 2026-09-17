import { resetPassword } from "@/backend/controllers/authControllers";
import { enforceRateLimit } from "@/backend/utils/rateLimit";
import { NextRequest, NextResponse } from "next/server";

interface RequestContext {
    params: { token: string };
}

export async function PUT(request: NextRequest, ctx: RequestContext): Promise<NextResponse> {
    const rateLimitResponse = enforceRateLimit(request, "password:reset", {
        limit: 5,
        windowMs: 15 * 60 * 1000,
    });
    if (rateLimitResponse) return rateLimitResponse;
    return await resetPassword(request, ctx);
}
export const dynamic = "force-dynamic";
