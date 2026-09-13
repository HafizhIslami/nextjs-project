import { deleteBooking } from "@/backend/controllers/bookingControllers";
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { IUser } from "@/backend/models/user";

interface RequestContext {
  params: {
    id: string;
  };
}

export async function DELETE(
  request: NextRequest,
  ctx: RequestContext
): Promise<NextResponse> {
  const session = await getToken({ req: request });
  if (!session) {
    return NextResponse.json({ message: "Login first to access this route" }, { status: 401 });
  }

  request.user = session.user as IUser;
  return await deleteBooking(request, ctx);
}
export const dynamic = "force-dynamic";
