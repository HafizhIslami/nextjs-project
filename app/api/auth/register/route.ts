import { registerUser } from "@/backend/controllers/authControllers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest): Promise<NextResponse> {
    return await registerUser(request, {});
}
export const dynamic = "force-dynamic";
