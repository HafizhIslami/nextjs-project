import dbConnect from "@/backend/config/dbConnect";
import Merchant from "@/backend/models/merchant";
import { catchAsyncErrors } from "@/backend/middlewares/catchAsyncErrors";
import { requirePlatformRole } from "@/backend/middlewares/routeAuth";
import { writePlatformAudit } from "@/backend/platform/audit";
import { requirePlatformHostname } from "@/backend/platform/request";
import ErrorHandler from "@/backend/utils/errorHandler";
import { requireObjectId } from "@/backend/utils/validation";
import { NextRequest, NextResponse } from "next/server";

type Context = { params: { id: string } };

const updateStatus = catchAsyncErrors<Context>(async (request, { params }) => {
  await dbConnect({ throwOnError: true });
  const id = requireObjectId(params.id, "merchant ID");
  const body = await request.json();
  const status = body?.status;
  if (!["active", "suspended", "archived"].includes(status)) {
    throw new ErrorHandler("Invalid merchant status", 400);
  }
  const auth = await requirePlatformRole(
    request,
    status === "archived" ? ["owner"] : ["owner", "admin"]
  );
  if (auth instanceof NextResponse) return auth;
  const merchant = await Merchant.findById(id);
  if (!merchant) throw new ErrorHandler("Merchant not found", 404);
  const previousStatus = merchant.status;
  merchant.status = status;
  merchant.suspendedAt = status === "suspended" ? new Date() : undefined;
  merchant.suspensionReason = status === "suspended" && typeof body?.reason === "string"
    ? body.reason.trim().slice(0, 500)
    : undefined;
  await merchant.save();
  await writePlatformAudit({
    actorUserId: auth.user._id.toString(),
    actorRole: auth.membership.role,
    action: `merchant.${status}`,
    targetType: "merchant",
    targetId: id,
    merchantId: id,
    changes: { previousStatus, status, reason: merchant.suspensionReason },
    request,
  });
  return NextResponse.json({ merchant });
});

export async function POST(request: NextRequest, context: Context) {
  const hostError = requirePlatformHostname(request);
  if (hostError) return hostError;
  return updateStatus(request, context);
}

export const dynamic = "force-dynamic";
