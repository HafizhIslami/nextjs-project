import dbConnect from "@/backend/config/dbConnect";
import { PlatformAuditLog } from "@/backend/models/platform";
import { requirePlatformRole } from "@/backend/middlewares/routeAuth";
import { requirePlatformHostname } from "@/backend/platform/request";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const hostError = requirePlatformHostname(request);
  if (hostError) return hostError;
  const auth = await requirePlatformRole(request, ["owner", "admin", "support"]);
  if (auth instanceof NextResponse) return auth;
  await dbConnect({ throwOnError: true });
  const logs = await PlatformAuditLog.find()
    .sort({ createdAt: -1 })
    .limit(250)
    .populate("actorUserId", "name email")
    .lean()
    .exec();
  return NextResponse.json({ logs });
}

export const dynamic = "force-dynamic";
