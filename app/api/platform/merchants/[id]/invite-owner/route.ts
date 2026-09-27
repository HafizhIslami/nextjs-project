import dbConnect from "@/backend/config/dbConnect";
import Merchant from "@/backend/models/merchant";
import { MerchantMember } from "@/backend/models/merchantIdentity";
import { catchAsyncErrors } from "@/backend/middlewares/catchAsyncErrors";
import { requirePlatformRole } from "@/backend/middlewares/routeAuth";
import { writePlatformAudit } from "@/backend/platform/audit";
import { sendMerchantOwnerInvitation } from "@/backend/platform/invitation";
import { requirePlatformHostname } from "@/backend/platform/request";
import { buildInvitationUrl, createOwnerInvitation } from "@/backend/services/merchantProvisioningService";
import ErrorHandler from "@/backend/utils/errorHandler";
import { requireObjectId } from "@/backend/utils/validation";
import { NextRequest, NextResponse } from "next/server";

type Context = { params: { id: string } };

const resend = catchAsyncErrors<Context>(async (request, { params }) => {
  await dbConnect({ throwOnError: true });
  const auth = await requirePlatformRole(request, ["owner", "admin"]);
  if (auth instanceof NextResponse) return auth;
  const merchantId = requireObjectId(params.id, "merchant ID");
  const merchant = await Merchant.findById(merchantId).lean().exec();
  if (!merchant) throw new ErrorHandler("Merchant not found", 404);
  const membership = await MerchantMember.findOne({ merchantId, role: "owner", status: "invited" })
    .populate<{ userId: { _id: { toString(): string }; name: string; email: string } }>("userId", "name email accountStatus")
    .exec();
  if (!membership?.userId) throw new ErrorHandler("This merchant has no pending owner invitation", 409);
  const invitation = await createOwnerInvitation(membership.userId._id.toString());
  const activationUrl = buildInvitationUrl(invitation.token);
  const sent = await sendMerchantOwnerInvitation({
    email: membership.userId.email,
    ownerName: membership.userId.name,
    merchantName: merchant.name,
    activationUrl,
  });
  await writePlatformAudit({
    actorUserId: auth.user._id.toString(),
    actorRole: auth.membership.role,
    action: "merchant.owner_invitation_resent",
    targetType: "merchant",
    targetId: merchantId,
    merchantId,
    request,
  });
  const showLink = process.env.NODE_ENV !== "production" || process.env.PLATFORM_SHOW_INVITE_LINK === "true";
  return NextResponse.json({ delivery: sent ? "sent" : "pending", activationUrl: showLink ? activationUrl : undefined });
});

export async function POST(request: NextRequest, context: Context) {
  const hostError = requirePlatformHostname(request);
  if (hostError) return hostError;
  return resend(request, context);
}

export const dynamic = "force-dynamic";
