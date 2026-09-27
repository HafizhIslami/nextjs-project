import dbConnect from "@/backend/config/dbConnect";
import { Channel, ChannelListing, Offering } from "@/backend/models/catalog";
import { Quotation } from "@/backend/models/commerce";
import { Customer } from "@/backend/models/merchantIdentity";
import { catchAsyncErrors } from "@/backend/middlewares/catchAsyncErrors";
import { requireUser } from "@/backend/middlewares/routeAuth";
import { requireTenantContext } from "@/backend/tenancy/requestTenant";
import ErrorHandler from "@/backend/utils/errorHandler";
import { requireObjectId, requireString } from "@/backend/utils/validation";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

const createQuotation = catchAsyncErrors(async (request: NextRequest) => {
  await dbConnect({ throwOnError: true });
  const tenant = await requireTenantContext(request);
  const body = await request.json();
  const offeringId = requireObjectId(body?.offeringId, "offering ID");
  const quantity = Number(body?.quantity || 1);
  if (!Number.isSafeInteger(quantity) || quantity < 1) {
    throw new ErrorHandler("Invalid quotation quantity", 400);
  }

  const merchantId = new mongoose.Types.ObjectId(tenant.merchantId);
  const channel = await Channel.findOne({ merchantId, code: "retail", status: "active" }).lean().exec();
  if (!channel) throw new ErrorHandler("Retail channel not found", 404);
  const [offering, listing] = await Promise.all([
    Offering.findOne({ _id: offeringId, merchantId, status: "active" }).lean().exec(),
    ChannelListing.findOne({ offeringId, merchantId, channelId: channel._id, visible: true }).lean().exec(),
  ]);
  if (!offering || !listing) throw new ErrorHandler("Offering not found", 404);

  const customer = await Customer.findOneAndUpdate(
    { merchantId, userId: request.user._id },
    {
      $set: { name: request.user.name, email: request.user.email, status: "active" },
      $setOnInsert: {
        merchantId,
        userId: request.user._id,
        customerCode: `CUS-${request.user._id.toString().slice(-8).toUpperCase()}`,
        type: "individual",
        channelIds: [channel._id],
        customerGroupIds: [],
      },
    },
    { upsert: true, returnDocument: "after", runValidators: true }
  );

  const quotationNumber = `${tenant.merchantCode.toUpperCase()}-Q-${new mongoose.Types.ObjectId().toString().slice(-8).toUpperCase()}`;
  const quotation = await Quotation.create({
    merchantId,
    channelId: channel._id,
    customerId: customer._id,
    quotationNumber,
    status: "requested",
    items: [{
      offeringId: offering._id,
      description: requireString(body?.description || offering.name, "Request details", 3000),
      quantity,
      configuration: body?.configuration && typeof body.configuration === "object" ? body.configuration : {},
    }],
    currency: tenant.currency,
  });
  return NextResponse.json({ quotation }, { status: 201 });
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireUser(request);
  if (auth instanceof NextResponse) return auth;
  return createQuotation(request, {});
}

export const dynamic = "force-dynamic";
