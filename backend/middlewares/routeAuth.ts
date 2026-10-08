import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import type { IUser } from "../models/user";

type AuthResult = IUser | NextResponse;

const unauthorized = () =>
  NextResponse.json(
    { message: "Login first to access this route" },
    { status: 401 }
  );

export const requireUser = async (request: NextRequest): Promise<AuthResult> => {
  const session = await getToken({ req: request });

  if (!session?.user) {
    return unauthorized();
  }

  const user = session.user as IUser;
  request.user = user;
  return user;
};

export const requireAdmin = async (
  request: NextRequest
): Promise<AuthResult> => {
  const auth = await requireUser(request);

  if (auth instanceof NextResponse) {
    return auth;
  }

  if (auth.role !== "admin") {
    return NextResponse.json(
      { errMessage: `Role (${auth.role} is not allowed to access this resource.)` },
      { status: 403 }
    );
  }

  return auth;
};

