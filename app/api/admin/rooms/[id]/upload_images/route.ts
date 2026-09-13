import { uploadRoomImages } from "@/backend/controllers/roomControllers";
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { IUser } from "@/backend/models/user";

interface RequestContext {
    params: { id: string };
}

export async function PUT(request: NextRequest, ctx: RequestContext): Promise<NextResponse> {
    const session = await getToken({ req: request });
    if (!session) {
        return NextResponse.json({ message: "Login first to access this route" }, { status: 401 });
    }

    const user = session.user as IUser;
    if (user.role !== "admin") {
        return NextResponse.json({ errMessage: `Role (${user.role} is not allowed to access this resource.)` }, { status: 403 });
    }

    request.user = user;
    return await uploadRoomImages(request, ctx);
}
export const dynamic = "force-dynamic";
