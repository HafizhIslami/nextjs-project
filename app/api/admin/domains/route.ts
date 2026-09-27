import dbConnect from "@/backend/config/dbConnect";
import { MerchantDomain } from "@/backend/models/merchant";
import { catchAsyncErrors } from "@/backend/middlewares/catchAsyncErrors";
import { requireMerchantRole } from "@/backend/middlewares/routeAuth";
import { normalizeHostname } from "@/backend/tenancy/hostname";
import { requireTenantContext } from "@/backend/tenancy/requestTenant";
import ErrorHandler from "@/backend/utils/errorHandler";
import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

const list = catchAsyncErrors(async (request: NextRequest) => {
  await dbConnect({ throwOnError: true });
  const tenant = await requireTenantContext(request);
  const domains = await MerchantDomain.find({ merchantId: tenant.merchantId })
    .select("-verification.tokenHash")
    .sort({ isPrimary: -1, createdAt: 1 })
    .lean()
    .exec();
  return NextResponse.json({ domains });
});

const create = catchAsyncErrors(async (request: NextRequest) => {
  await dbConnect({ throwOnError: true });
  const tenant = await requireTenantContext(request);
  const body = await request.json();
  const hostname = normalizeHostname(body?.hostname);
  if (!hostname || hostname === "localhost" || hostname.endsWith(".localhost")) {
    throw new ErrorHandler("Enter a valid public custom domain", 400);
  }
  const platformRoot = normalizeHostname(process.env.PLATFORM_ROOT_DOMAIN);
  if (platformRoot && (hostname === platformRoot || hostname.endsWith(`.${platformRoot}`))) {
    throw new ErrorHandler("Platform subdomains are managed from the merchant code", 400);
  }

  const token = `roomi-${crypto.randomBytes(24).toString("hex")}`;
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  let domain = await MerchantDomain.findOne({ hostname });
  if (domain && domain.merchantId.toString() !== tenant.merchantId) {
    throw new ErrorHandler("This domain is already claimed", 409);
  }
  if (!domain) {
    domain = await MerchantDomain.create({
      merchantId: tenant.merchantId,
      hostname,
      type: "custom_domain",
      isPrimary: false,
      status: "pending",
      sslStatus: "pending",
      verification: { method: "dns_txt", tokenHash },
    });
  } else {
    domain.status = "pending";
    domain.sslStatus = "pending";
    domain.verification = { method: "dns_txt", tokenHash };
    await domain.save();
  }
  return NextResponse.json({
    domain: { hostname: domain.hostname, status: domain.status },
    dns: { type: "TXT", name: `_roomi-verification.${hostname}`, value: token },
  }, { status: 201 });
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await requireMerchantRole(request, ["owner", "admin", "manager", "staff"]);
  if (auth instanceof NextResponse) return auth;
  return list(request, {});
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireMerchantRole(request, ["owner"]);
  if (auth instanceof NextResponse) return auth;
  return create(request, {});
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
