import { forgotPassword } from "@/backend/controllers/authControllers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest): Promise<NextResponse> {
    return forgotPassword(request, {});
}
