import dbConnect from "@/backend/config/dbConnect";
import { Channel, ChannelListing, Offering, PriceEntry } from "@/backend/models/catalog";
import { catchAsyncErrors } from "@/backend/middlewares/catchAsyncErrors";
import { requireMerchantRole } from "@/backend/middlewares/routeAuth";
import { requireTenantContext } from "@/backend/tenancy/requestTenant";
import ErrorHandler from "@/backend/utils/errorHandler";
import { requireObjectId } from "@/backend/utils/validation";
import { NextRequest, NextResponse } from "next/server";

const upsertListing = catchAsyncErrors(async (request: NextRequest) => {
  await dbConnect({ throwOnError: true });
  const tenant = await requireTenantContext(request);
  const body = await request.json();
  const offeringId = requireObjectId(body?.offeringId, "offering ID");
  const channelId = requireObjectId(body?.channelId, "channel ID");

  const [offering, channel] = await Promise.all([
    Offering.findOne({ _id: offeringId, merchantId: tenant.merchantId }).lean().exec(),
    Channel.findOne({ _id: channelId, merchantId: tenant.merchantId }).lean().exec(),
  ]);
  if (!offering || !channel) throw new ErrorHandler("Offering or channel not found", 404);

  const listing = await ChannelListing.findOneAndUpdate(
    { merchantId: tenant.merchantId, offeringId, channelId },
    {
      $set: {
        status: body?.status === "inactive" ? "inactive" : "active",
        visible: body?.visible !== false,
        purchasable: body?.purchasable !== false,
        minimumQuantity: Number.isSafeInteger(Number(body?.minimumQuantity))
          ? Math.max(1, Number(body.minimumQuantity))
          : 1,
      },
      $setOnInsert: { merchantId: tenant.merchantId, offeringId, channelId },
    },
    { upsert: true, returnDocument: "after", runValidators: true }
  ).lean().exec();

  let priceEntry = null;
  if (body?.amountMinor !== undefined && channel.defaultPriceListId) {
    const amountMinor = Number(body.amountMinor);
    if (!Number.isSafeInteger(amountMinor) || amountMinor < 0) {
      throw new ErrorHandler("Invalid channel price", 400);
    }
    priceEntry = await PriceEntry.findOneAndUpdate(
      {
        merchantId: tenant.merchantId,
        priceListId: channel.defaultPriceListId,
        offeringId,
        minimumQuantity: 1,
        variantId: { $exists: false },
      },
      {
        $set: {
          pricingModel: offering.pricing.model === "quote" ? "fixed" : offering.pricing.model,
          amountMinor,
        },
        $setOnInsert: {
          merchantId: tenant.merchantId,
          priceListId: channel.defaultPriceListId,
          offeringId,
          minimumQuantity: 1,
        },
      },
      { upsert: true, returnDocument: "after", runValidators: true }
    ).lean().exec();
  }

  return NextResponse.json({ listing, priceEntry });
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireMerchantRole(request, ["owner", "admin", "manager"]);
  if (auth instanceof NextResponse) return auth;
  return upsertListing(request, {});
}

export const dynamic = "force-dynamic";
