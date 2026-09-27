import dbConnect from "@/backend/config/dbConnect";
import { Channel } from "@/backend/models/catalog";
import { Customer } from "@/backend/models/merchantIdentity";
import { requireUser } from "@/backend/middlewares/routeAuth";
import { requireTenantContext } from "@/backend/tenancy/requestTenant";
import ErrorHandler from "@/backend/utils/errorHandler";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { catchAsyncErrors } from "@/backend/middlewares/catchAsyncErrors";

const apply = catchAsyncErrors(async (request: NextRequest) => {
  await dbConnect({ throwOnError: true });
  const tenant = await requireTenantContext(request);
  const merchantId = new mongoose.Types.ObjectId(tenant.merchantId);
  const channel = await Channel.findOne({ merchantId, code: "reseller", status: "active" });
  if (!channel) throw new ErrorHandler("Reseller channel is not available", 404);
  const customer = await Customer.findOneAndUpdate(
    { merchantId, userId: request.user._id },
    {
      $set: {
        name: request.user.name,
        email: request.user.email,
        status: "pending",
        "reseller.requested": true,
      },
      $setOnInsert: {
        merchantId,
        userId: request.user._id,
        customerCode: `CUS-${request.user._id.toString().slice(-8).toUpperCase()}`,
        type: "business",
        channelIds: [],
        customerGroupIds: [],
      },
    },
    { upsert: true, returnDocument: "after", runValidators: true }
  );
  return NextResponse.json({ success: true, status: customer.reseller.approved ? "approved" : "pending" });
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireUser(request);
  if (auth instanceof NextResponse) return auth;
  return apply(request, {});
}

export const dynamic = "force-dynamic";
