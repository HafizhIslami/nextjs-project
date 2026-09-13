import { resetPassword } from "@/backend/controllers/authControllers";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest): Promise<NextResponse> {
    return resetPassword(request, {});
}
