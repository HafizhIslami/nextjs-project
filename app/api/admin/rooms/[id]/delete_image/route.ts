import { deleteRoomImage } from "@/backend/controllers/roomControllers";
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { IUser } from "@/backend/models/user";

export async function PUT(request: NextRequest): Promise<NextResponse> {
    const session = await getToken({ req: request });
    if (!session) {
        return NextResponse.json({ message: "Login first to access this route" }, { status: 401 });
    }

    const user = session.user as IUser;
    if (user.role !== "admin") {
        return NextResponse.json({ errMessage: `Role (${user.role} is not allowed to access this resource.)` }, { status: 403 });
    }

    request.user = user;
    return deleteRoomImage(request, {});
}
