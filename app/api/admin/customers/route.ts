import dbConnect from "@/backend/config/dbConnect";
import { Channel } from "@/backend/models/catalog";
import { Customer } from "@/backend/models/merchantIdentity";
import { catchAsyncErrors } from "@/backend/middlewares/catchAsyncErrors";
import { requireMerchantRole } from "@/backend/middlewares/routeAuth";
import { requireTenantContext } from "@/backend/tenancy/requestTenant";
import ErrorHandler from "@/backend/utils/errorHandler";
import { requireObjectId } from "@/backend/utils/validation";
import { NextRequest, NextResponse } from "next/server";

const list = catchAsyncErrors(async (request: NextRequest) => {
  await dbConnect({ throwOnError: true });
  const tenant = await requireTenantContext(request);
  const customers = await Customer.find({ merchantId: tenant.merchantId })
    .sort({ createdAt: -1 })
    .lean()
    .exec();
  return NextResponse.json({ customers });
});

const update = catchAsyncErrors(async (request: NextRequest) => {
  await dbConnect({ throwOnError: true });
  const tenant = await requireTenantContext(request);
  const body = await request.json();
  const customerId = requireObjectId(body?.customerId, "customer ID");
  const channel = await Channel.findOne({ merchantId: tenant.merchantId, code: "reseller" })
    .select({ _id: 1 })
    .lean()
    .exec();
  if (!channel) throw new ErrorHandler("Reseller channel not found", 404);

  const approved = body?.approved === true;
  const updateOperation = approved
    ? {
        $set: {
          status: "active",
          "reseller.requested": true,
          "reseller.approved": true,
          "reseller.approvedAt": new Date(),
          "reseller.approvedBy": request.user._id,
        },
        $addToSet: { channelIds: channel._id },
      }
    : {
        $set: { status: "active", "reseller.approved": false },
        $pull: { channelIds: channel._id },
      };
  const customer = await Customer.findOneAndUpdate(
    { _id: customerId, merchantId: tenant.merchantId },
    updateOperation,
    { returnDocument: "after", runValidators: true }
  ).lean().exec();
  if (!customer) throw new ErrorHandler("Customer not found", 404);
  return NextResponse.json({ customer });
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await requireMerchantRole(request, ["owner", "admin", "manager", "staff"]);
  if (auth instanceof NextResponse) return auth;
  return list(request, {});
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const auth = await requireMerchantRole(request, ["owner", "admin", "manager"]);
  if (auth instanceof NextResponse) return auth;
  return update(request, {});
}

export const dynamic = "force-dynamic";
