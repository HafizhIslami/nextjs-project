import dbConnect from "@/backend/config/dbConnect";
import { Order } from "@/backend/models/commerce";
import Merchant, { MerchantDomain } from "@/backend/models/merchant";
import { Customer, MerchantMember } from "@/backend/models/merchantIdentity";
import { catchAsyncErrors } from "@/backend/middlewares/catchAsyncErrors";
import { requirePlatformRole } from "@/backend/middlewares/routeAuth";
import { sendMerchantOwnerInvitation } from "@/backend/platform/invitation";
import { requirePlatformHostname } from "@/backend/platform/request";
import {
  buildInvitationUrl,
  provisionMerchant,
  type ProvisionMerchantInput,
} from "@/backend/services/merchantProvisioningService";
import { enforceRateLimit } from "@/backend/utils/rateLimit";
import { NextRequest, NextResponse } from "next/server";

const listMerchants = catchAsyncErrors(async (request: NextRequest) => {
  await dbConnect({ throwOnError: true });
  const search = request.nextUrl.searchParams.get("q")?.trim();
  const status = request.nextUrl.searchParams.get("status")?.trim();
  const filter: Record<string, unknown> = {};
  if (search) filter.$or = [
    { name: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } },
    { merchantCode: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } },
  ];
  if (["draft", "active", "suspended", "archived"].includes(status || "")) filter.status = status;
  const merchants = await Merchant.find(filter).sort({ createdAt: -1 }).limit(100).lean().exec();
  const ids = merchants.map((merchant) => merchant._id);
  const [domains, ownerCounts, orderCounts, customerCounts] = await Promise.all([
    MerchantDomain.find({ merchantId: { $in: ids }, isPrimary: true }).lean().exec(),
    MerchantMember.aggregate([
      { $match: { merchantId: { $in: ids }, role: "owner" } },
      { $group: { _id: "$merchantId", count: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: { merchantId: { $in: ids } } },
      { $group: { _id: "$merchantId", count: { $sum: 1 } } },
    ]),
    Customer.aggregate([
      { $match: { merchantId: { $in: ids } } },
      { $group: { _id: "$merchantId", count: { $sum: 1 } } },
    ]),
  ]);
  const indexed = (rows: Array<{ _id: unknown; count: number }>) =>
    new Map(rows.map((row) => [String(row._id), row.count]));
  const domainByMerchant = new Map(domains.map((domain) => [String(domain.merchantId), domain]));
  const owners = indexed(ownerCounts);
  const orders = indexed(orderCounts);
  const customers = indexed(customerCounts);
  return NextResponse.json({
    merchants: merchants.map((merchant) => ({
      ...merchant,
      primaryDomain: domainByMerchant.get(String(merchant._id)),
      metrics: {
        owners: owners.get(String(merchant._id)) || 0,
        orders: orders.get(String(merchant._id)) || 0,
        customers: customers.get(String(merchant._id)) || 0,
      },
    })),
  });
});

const createMerchant = catchAsyncErrors(async (request: NextRequest) => {
  const limited = enforceRateLimit(request, "platform:provision", { limit: 20, windowMs: 60 * 60 * 1000 });
  if (limited) return limited;
  await dbConnect({ throwOnError: true });
  const auth = await requirePlatformRole(request, ["owner", "admin"]);
  if (auth instanceof NextResponse) return auth;
  const body = (await request.json()) as ProvisionMerchantInput;
  const idempotencyKey = request.headers.get("idempotency-key") || body.idempotencyKey;
  const result = await provisionMerchant(
    { ...body, idempotencyKey },
    {
      userId: auth.user._id.toString(),
      role: auth.membership.role as "owner" | "admin",
      request,
    }
  );

  let invitationDelivery: "not_required" | "sent" | "pending" = "not_required";
  let activationUrl: string | undefined;
  if (result.ownerInvited && result.invitationToken && result.owner) {
    activationUrl = buildInvitationUrl(result.invitationToken);
    const sent = await sendMerchantOwnerInvitation({
      email: result.owner.email,
      ownerName: result.owner.name,
      merchantName: result.merchant.name,
      activationUrl,
    });
    invitationDelivery = sent ? "sent" : "pending";
  }

  const showLink = process.env.NODE_ENV !== "production" || process.env.PLATFORM_SHOW_INVITE_LINK === "true";
  return NextResponse.json(
    {
      merchant: result.merchant,
      domain: result.domain,
      reused: result.reused,
      ownerInvited: result.ownerInvited,
      invitationDelivery,
      activationUrl: showLink ? activationUrl : undefined,
    },
    { status: result.reused ? 200 : 201 }
  );
});

export async function GET(request: NextRequest) {
  const hostError = requirePlatformHostname(request);
  if (hostError) return hostError;
  const auth = await requirePlatformRole(request, ["owner", "admin", "support"]);
  if (auth instanceof NextResponse) return auth;
  return listMerchants(request, {});
}

export async function POST(request: NextRequest) {
  const hostError = requirePlatformHostname(request);
  if (hostError) return hostError;
  return createMerchant(request, {});
}

export const dynamic = "force-dynamic";
