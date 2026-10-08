import { forgotPassword } from "@/backend/controllers/authControllers";
import { enforceRateLimit } from "@/backend/utils/rateLimit";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest): Promise<NextResponse> {
    const rateLimitResponse = enforceRateLimit(request, "password:forgot", {
        limit: 3,
        windowMs: 15 * 60 * 1000,
    });
    if (rateLimitResponse) return rateLimitResponse;
    return await forgotPassword(request, {});
}
export const dynamic = "force-dynamic";
