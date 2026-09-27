import dbConnect from "@/backend/config/dbConnect";
import { requirePlatformRole } from "@/backend/middlewares/routeAuth";
import { requirePlatformHostname } from "@/backend/platform/request";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const hostError = requirePlatformHostname(request);
  if (hostError) return hostError;
  await dbConnect({ throwOnError: true });
  const auth = await requirePlatformRole(request, ["owner", "admin", "support"]);
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json({
    membership: auth.membership,
    user: { id: auth.user._id, name: auth.user.name, email: auth.user.email },
  });
}

export const dynamic = "force-dynamic";
