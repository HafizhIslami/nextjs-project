import { deleteUser, getUserDetails, updateUser } from "@/backend/controllers/authControllers";
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { IUser } from "@/backend/models/user";

async function authenticate(request: NextRequest): Promise<IUser | NextResponse> {
    const session = await getToken({ req: request });
    if (!session) {
        return NextResponse.json({ message: "Login first to access this route" }, { status: 401 });
    }
    const user = session.user as IUser;
    if (user.role !== "admin") {
        return NextResponse.json({ errMessage: `Role (${user.role} is not allowed to access this resource.)` }, { status: 403 });
    }
    return user;
}

export async function GET(request: NextRequest, ctx: { params: { id: string } }): Promise<NextResponse> {
    const auth = await authenticate(request);
    if (auth instanceof NextResponse) return auth;
    request.user = auth;
    return getUserDetails(request, ctx);
}

export async function PUT(request: NextRequest, ctx: { params: { id: string } }): Promise<NextResponse> {
    const auth = await authenticate(request);
    if (auth instanceof NextResponse) return auth;
    request.user = auth;
    return updateUser(request, ctx);
}

export async function DELETE(request: NextRequest, ctx: { params: { id: string } }): Promise<NextResponse> {
    const auth = await authenticate(request);
    if (auth instanceof NextResponse) return auth;
    request.user = auth;
    return deleteUser(request, ctx);
}
