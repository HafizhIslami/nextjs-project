import dbConnect from "@/backend/config/dbConnect";
import { Channel, PriceList } from "@/backend/models/catalog";
import { catchAsyncErrors } from "@/backend/middlewares/catchAsyncErrors";
import { requireMerchantRole } from "@/backend/middlewares/routeAuth";
import { requireTenantContext } from "@/backend/tenancy/requestTenant";
import ErrorHandler from "@/backend/utils/errorHandler";
import { requireString } from "@/backend/utils/validation";
import { NextRequest, NextResponse } from "next/server";

const list = catchAsyncErrors(async (request: NextRequest) => {
  await dbConnect({ throwOnError: true });
  const tenant = await requireTenantContext(request);
  const channels = await Channel.find({ merchantId: tenant.merchantId })
    .sort({ type: 1, name: 1 })
    .lean()
    .exec();
  return NextResponse.json({ channels });
});

const create = catchAsyncErrors(async (request: NextRequest) => {
  await dbConnect({ throwOnError: true });
  const tenant = await requireTenantContext(request);
  const body = await request.json();
  const code = requireString(body?.code, "Channel code", 60).toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(code)) {
    throw new ErrorHandler("Invalid channel code", 400);
  }
  const type = body?.type;
  if (!["retail", "reseller", "internal", "marketplace"].includes(type)) {
    throw new ErrorHandler("Invalid channel type", 400);
  }

  const priceList = await PriceList.create({
    merchantId: tenant.merchantId,
    code: `${code}-default`,
    name: `${requireString(body?.name, "Channel name", 100)} pricing`,
    currency: tenant.currency,
    status: "active",
  });
  const isPrivate = type === "reseller" || type === "internal";
  const channel = await Channel.create({
    merchantId: tenant.merchantId,
    code,
    name: requireString(body?.name, "Channel name", 100),
    type,
    status: "active",
    visibility: isPrivate ? "private" : "public",
    defaultPriceListId: priceList._id,
    rules: {
      requireLogin: isPrivate,
      requireApproval: type === "reseller",
      allowGuestCheckout: !isPrivate,
      allowBackorder: false,
      allowedPaymentMethods: ["stripe"],
    },
  });
  return NextResponse.json({ channel, priceList }, { status: 201 });
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await requireMerchantRole(request, ["owner", "admin", "manager", "staff"]);
  if (auth instanceof NextResponse) return auth;
  return list(request, {});
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireMerchantRole(request, ["owner", "admin"]);
  if (auth instanceof NextResponse) return auth;
  return create(request, {});
}

export const dynamic = "force-dynamic";
