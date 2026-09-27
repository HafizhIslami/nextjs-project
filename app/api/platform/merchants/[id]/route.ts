import dbConnect from "@/backend/config/dbConnect";
import { Channel, PriceList } from "@/backend/models/catalog";
import Merchant, { MerchantDomain } from "@/backend/models/merchant";
import { MerchantMember } from "@/backend/models/merchantIdentity";
import { catchAsyncErrors } from "@/backend/middlewares/catchAsyncErrors";
import { requirePlatformRole } from "@/backend/middlewares/routeAuth";
import { writePlatformAudit } from "@/backend/platform/audit";
import { requirePlatformHostname } from "@/backend/platform/request";
import ErrorHandler from "@/backend/utils/errorHandler";
import { requireObjectId, requireString } from "@/backend/utils/validation";
import { NextRequest, NextResponse } from "next/server";

type Context = { params: { id: string } };

const getMerchant = catchAsyncErrors<Context>(async (_request, { params }) => {
  await dbConnect({ throwOnError: true });
  const id = requireObjectId(params.id, "merchant ID");
  const merchant = await Merchant.findById(id).lean().exec();
  if (!merchant) throw new ErrorHandler("Merchant not found", 404);
  const [domains, members, channels, priceLists] = await Promise.all([
    MerchantDomain.find({ merchantId: id }).sort({ isPrimary: -1 }).lean().exec(),
    MerchantMember.find({ merchantId: id }).populate("userId", "name email accountStatus").lean().exec(),
    Channel.find({ merchantId: id }).lean().exec(),
    PriceList.find({ merchantId: id }).lean().exec(),
  ]);
  return NextResponse.json({ merchant, domains, members, channels, priceLists });
});

const updateMerchant = catchAsyncErrors<Context>(async (request, { params }) => {
  await dbConnect({ throwOnError: true });
  const auth = await requirePlatformRole(request, ["owner", "admin"]);
  if (auth instanceof NextResponse) return auth;
  const id = requireObjectId(params.id, "merchant ID");
  const body = await request.json();
  const before = await Merchant.findById(id).lean().exec();
  if (!before) throw new ErrorHandler("Merchant not found", 404);
  const update: Record<string, unknown> = {};
  if (body?.name !== undefined) update.name = requireString(body.name, "Merchant name", 120);
  if (body?.legalName !== undefined) update.legalName = typeof body.legalName === "string" ? body.legalName.trim() : "";
  if (Array.isArray(body?.enabledModules)) {
    const allowed = ["catalog", "commerce", "inventory", "rental", "quotation"];
    update.enabledModules = body.enabledModules.filter((item: unknown) => typeof item === "string" && allowed.includes(item));
  }
  const merchant = await Merchant.findByIdAndUpdate(id, { $set: update }, { returnDocument: "after", runValidators: true }).lean().exec();
  await writePlatformAudit({
    actorUserId: auth.user._id.toString(),
    actorRole: auth.membership.role,
    action: "merchant.updated",
    targetType: "merchant",
    targetId: id,
    merchantId: id,
    changes: { before: { name: before.name, enabledModules: before.enabledModules }, after: update },
    request,
  });
  return NextResponse.json({ merchant });
});

export async function GET(request: NextRequest, context: Context) {
  const hostError = requirePlatformHostname(request);
  if (hostError) return hostError;
  const auth = await requirePlatformRole(request, ["owner", "admin", "support"]);
  if (auth instanceof NextResponse) return auth;
  return getMerchant(request, context);
}

export async function PATCH(request: NextRequest, context: Context) {
  const hostError = requirePlatformHostname(request);
  if (hostError) return hostError;
  return updateMerchant(request, context);
}

export const dynamic = "force-dynamic";
