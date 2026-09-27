import { deleteUser, getUserDetails, updateUser } from "@/backend/controllers/authControllers";
import { NextRequest, NextResponse } from "next/server";
import { requireMerchantAdmin } from "@/backend/middlewares/routeAuth";

export async function GET(request: NextRequest, ctx: { params: { id: string } }): Promise<NextResponse> {
    const auth = await requireMerchantAdmin(request);
    if (auth instanceof NextResponse) return auth;
    return await getUserDetails(request, ctx);
}

export async function PUT(request: NextRequest, ctx: { params: { id: string } }): Promise<NextResponse> {
    const auth = await requireMerchantAdmin(request);
    if (auth instanceof NextResponse) return auth;
    return await updateUser(request, ctx);
}

export async function DELETE(request: NextRequest, ctx: { params: { id: string } }): Promise<NextResponse> {
    const auth = await requireMerchantAdmin(request);
    if (auth instanceof NextResponse) return auth;
    return await deleteUser(request, ctx);
}
export const dynamic = "force-dynamic";
