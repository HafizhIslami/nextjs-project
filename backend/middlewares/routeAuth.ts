import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import type { IUser } from "../models/user";
import { MerchantMember } from "../models/merchantIdentity";
import { requireTenantContext } from "../tenancy/requestTenant";
import dbConnect from "../config/dbConnect";
import { PlatformMember, type PlatformRole } from "../models/platform";

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

type MerchantRole = "owner" | "admin" | "manager" | "staff";

export const requireMerchantRole = async (
  request: NextRequest,
  roles: MerchantRole[] = ["owner", "admin"]
): Promise<AuthResult> => {
  const auth = await requireUser(request);
  if (auth instanceof NextResponse) return auth;

  const tenant = await requireTenantContext(request);

  // Backward compatibility while the original Roomi admin is migrated.
  if (tenant.isLegacyFallback && auth.role === "admin") return auth;

  await dbConnect({ throwOnError: true });
  const membership = await MerchantMember.exists({
    merchantId: tenant.merchantId,
    userId: auth._id,
    role: { $in: roles },
    status: "active",
  });

  if (!membership) {
    return NextResponse.json(
      { errMessage: "You do not have permission to manage this merchant." },
      { status: 403 }
    );
  }

  return auth;
};

export const requireMerchantAdmin = (request: NextRequest) =>
  requireMerchantRole(request, ["owner", "admin"]);

export type PlatformAuth = {
  user: IUser;
  membership: { role: PlatformRole; status: string };
};

export const requirePlatformRole = async (
  request: NextRequest,
  roles: PlatformRole[] = ["owner", "admin"]
): Promise<PlatformAuth | NextResponse> => {
  const auth = await requireUser(request);
  if (auth instanceof NextResponse) return auth;

  await dbConnect({ throwOnError: true });
  const membership = await PlatformMember.findOne({
    userId: auth._id,
    role: { $in: roles },
    status: "active",
  })
    .select({ role: 1, status: 1 })
    .lean()
    .exec();

  if (!membership) {
    return NextResponse.json(
      { errMessage: "You do not have permission to manage the platform." },
      { status: 403 }
    );
  }

  void PlatformMember.updateOne(
    { _id: membership._id },
    { $set: { lastAccessAt: new Date() } }
  ).exec();

  return {
    user: auth,
    membership: { role: membership.role, status: membership.status },
  };
};
