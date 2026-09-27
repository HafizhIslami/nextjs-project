import dbConnect from "@/backend/config/dbConnect";
import { Offering } from "@/backend/models/catalog";
import { catchAsyncErrors } from "@/backend/middlewares/catchAsyncErrors";
import { requireMerchantRole } from "@/backend/middlewares/routeAuth";
import { parseOfferingInput } from "@/backend/services/offeringInput";
import { requireTenantContext } from "@/backend/tenancy/requestTenant";
import { NextRequest, NextResponse } from "next/server";

const list = catchAsyncErrors(async (request: NextRequest) => {
  await dbConnect({ throwOnError: true });
  const tenant = await requireTenantContext(request);
  const offerings = await Offering.find({ merchantId: tenant.merchantId })
    .sort({ createdAt: -1 })
    .lean()
    .exec();
  return NextResponse.json({ offerings });
});

const create = catchAsyncErrors(async (request: NextRequest) => {
  await dbConnect({ throwOnError: true });
  const tenant = await requireTenantContext(request);
  const body = await request.json();
  const offering = await Offering.create({
    ...parseOfferingInput(body, tenant.currency),
    merchantId: tenant.merchantId,
    createdBy: request.user._id,
  });
  return NextResponse.json({ offering }, { status: 201 });
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await requireMerchantRole(request, ["owner", "admin", "manager", "staff"]);
  if (auth instanceof NextResponse) return auth;
  return list(request, {});
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireMerchantRole(request, ["owner", "admin", "manager"]);
  if (auth instanceof NextResponse) return auth;
  return create(request, {});
}

export const dynamic = "force-dynamic";
