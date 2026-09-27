import dbConnect from "@/backend/config/dbConnect";
import { Offering } from "@/backend/models/catalog";
import { catchAsyncErrors } from "@/backend/middlewares/catchAsyncErrors";
import { requireMerchantRole } from "@/backend/middlewares/routeAuth";
import { parseOfferingInput } from "@/backend/services/offeringInput";
import { requireTenantContext } from "@/backend/tenancy/requestTenant";
import ErrorHandler from "@/backend/utils/errorHandler";
import { requireObjectId } from "@/backend/utils/validation";
import { NextRequest, NextResponse } from "next/server";

type Context = { params: { id: string } };

const update = catchAsyncErrors(async (request: NextRequest, { params }: Context) => {
  await dbConnect({ throwOnError: true });
  const tenant = await requireTenantContext(request);
  const id = requireObjectId(params.id, "offering ID");
  const body = await request.json();
  const offering = await Offering.findOneAndUpdate(
    { _id: id, merchantId: tenant.merchantId },
    parseOfferingInput(body, tenant.currency),
    { returnDocument: "after", runValidators: true }
  ).lean().exec();
  if (!offering) throw new ErrorHandler("Offering not found", 404);
  return NextResponse.json({ offering });
});

const archive = catchAsyncErrors(async (request: NextRequest, { params }: Context) => {
  await dbConnect({ throwOnError: true });
  const tenant = await requireTenantContext(request);
  const id = requireObjectId(params.id, "offering ID");
  const offering = await Offering.findOneAndUpdate(
    { _id: id, merchantId: tenant.merchantId },
    { status: "archived" },
    { returnDocument: "after" }
  ).lean().exec();
  if (!offering) throw new ErrorHandler("Offering not found", 404);
  return NextResponse.json({ success: true, offering });
});

export async function PUT(request: NextRequest, context: Context): Promise<NextResponse> {
  const auth = await requireMerchantRole(request, ["owner", "admin", "manager"]);
  if (auth instanceof NextResponse) return auth;
  return update(request, context);
}

export async function DELETE(request: NextRequest, context: Context): Promise<NextResponse> {
  const auth = await requireMerchantRole(request, ["owner", "admin"]);
  if (auth instanceof NextResponse) return auth;
  return archive(request, context);
}

export const dynamic = "force-dynamic";
