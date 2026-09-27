import dbConnect from "@/backend/config/dbConnect";
import { MerchantDomain } from "@/backend/models/merchant";
import { catchAsyncErrors } from "@/backend/middlewares/catchAsyncErrors";
import { requireMerchantRole } from "@/backend/middlewares/routeAuth";
import { normalizeHostname } from "@/backend/tenancy/hostname";
import { requireTenantContext } from "@/backend/tenancy/requestTenant";
import ErrorHandler from "@/backend/utils/errorHandler";
import crypto from "node:crypto";
import { resolveTxt } from "node:dns/promises";
import { NextRequest, NextResponse } from "next/server";

const verify = catchAsyncErrors(async (request: NextRequest) => {
  await dbConnect({ throwOnError: true });
  const tenant = await requireTenantContext(request);
  const body = await request.json();
  const hostname = normalizeHostname(body?.hostname);
  const token = typeof body?.token === "string" ? body.token.trim() : "";
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const domain = await MerchantDomain.findOne({
    merchantId: tenant.merchantId,
    hostname,
    status: { $in: ["pending", "verifying", "failed"] },
  }).select("+verification.tokenHash");
  if (!domain || !token || domain.verification?.tokenHash !== tokenHash) {
    throw new ErrorHandler("Domain verification request is invalid", 400);
  }

  let records: string[][];
  try {
    records = await resolveTxt(`_roomi-verification.${hostname}`);
  } catch {
    throw new ErrorHandler("Verification TXT record was not found yet", 409);
  }
  if (!records.flat().includes(token)) {
    throw new ErrorHandler("Verification TXT record does not match", 409);
  }

  await MerchantDomain.updateMany(
    { merchantId: tenant.merchantId, isPrimary: true },
    { $set: { isPrimary: false } }
  );
  domain.status = "active";
  domain.isPrimary = true;
  domain.sslStatus = "pending";
  domain.verification.verifiedAt = new Date();
  await domain.save();
  return NextResponse.json({
    domain: { hostname: domain.hostname, status: domain.status, sslStatus: domain.sslStatus, isPrimary: true },
    message: "DNS is verified. Attach the domain to the hosting provider to provision TLS.",
  });
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireMerchantRole(request, ["owner"]);
  if (auth instanceof NextResponse) return auth;
  return verify(request, {});
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
