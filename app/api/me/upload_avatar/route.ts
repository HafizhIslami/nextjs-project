import { uploadAvatar } from "@/backend/controllers/authControllers";
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { IUser } from "@/backend/models/user";

export async function PUT(request: NextRequest): Promise<NextResponse> {
    const session = await getToken({ req: request });
    if (!session) {
        return NextResponse.json({ message: "Login first to access this route" }, { status: 401 });
    }
    request.user = session.user as IUser;
    return uploadAvatar(request, {});
}
