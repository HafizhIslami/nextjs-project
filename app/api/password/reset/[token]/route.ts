import { resetPassword } from "@/backend/controllers/authControllers";
import { NextRequest, NextResponse } from "next/server";

interface RequestContext {
    params: { token: string };
}

export async function PUT(request: NextRequest, ctx: RequestContext): Promise<NextResponse> {
    return await resetPassword(request, ctx);
}
export const dynamic = "force-dynamic";
