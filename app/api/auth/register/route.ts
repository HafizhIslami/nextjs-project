import { registerUser } from "@/backend/controllers/authControllers";
import { enforceRateLimit } from "@/backend/utils/rateLimit";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest): Promise<NextResponse> {
    const rateLimitResponse = enforceRateLimit(request, "auth:register", {
        limit: 5,
        windowMs: 15 * 60 * 1000,
    });
    if (rateLimitResponse) return rateLimitResponse;
    return await registerUser(request, {});
}
export const dynamic = "force-dynamic";
