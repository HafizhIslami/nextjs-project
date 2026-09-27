import dbConnect from "@/backend/config/dbConnect";
import Merchant from "@/backend/models/merchant";
import { catchAsyncErrors } from "@/backend/middlewares/catchAsyncErrors";
import { requireMerchantRole } from "@/backend/middlewares/routeAuth";
import { requireTenantContext } from "@/backend/tenancy/requestTenant";
import ErrorHandler from "@/backend/utils/errorHandler";
import { requireString } from "@/backend/utils/validation";
import { NextRequest, NextResponse } from "next/server";

const COLOR = /^#[0-9a-f]{6}$/i;

const getSettings = catchAsyncErrors(async (request: NextRequest) => {
  await dbConnect({ throwOnError: true });
  const tenant = await requireTenantContext(request);
  const merchant = await Merchant.findOne({ _id: tenant.merchantId, status: { $ne: "archived" } }).lean().exec();
  if (!merchant) throw new ErrorHandler("Merchant not found", 404);
  return NextResponse.json({ merchant });
});

const updateSettings = catchAsyncErrors(async (request: NextRequest) => {
  await dbConnect({ throwOnError: true });
  const tenant = await requireTenantContext(request);
  const body = await request.json();
  const colors = [body?.primaryColor, body?.secondaryColor, body?.accentColor];
  if (colors.some((color) => typeof color !== "string" || !COLOR.test(color))) {
    throw new ErrorHandler("Brand colors must use six-digit hexadecimal values", 400);
  }
  const logoUrl = typeof body?.logoUrl === "string" ? body.logoUrl.trim() : "";
  if (logoUrl && !logoUrl.startsWith("/") && !/^https:\/\//i.test(logoUrl)) {
    throw new ErrorHandler("Logo URL must use HTTPS or a local asset path", 400);
  }
  if (logoUrl.startsWith("https://")) {
    let hostname = "";
    try {
      hostname = new URL(logoUrl).hostname;
    } catch {
      throw new ErrorHandler("Logo URL is invalid", 400);
    }
    if (hostname !== "res.cloudinary.com") {
      throw new ErrorHandler("Remote logos must be hosted on the configured Cloudinary account", 400);
    }
  }
  const merchant = await Merchant.findOneAndUpdate(
    { _id: tenant.merchantId, status: { $ne: "archived" } },
    {
      $set: {
        name: requireString(body?.name, "Merchant name", 120),
        "branding.logoUrl": logoUrl || undefined,
        "branding.primaryColor": colors[0],
        "branding.secondaryColor": colors[1],
        "branding.accentColor": colors[2],
      },
    },
    { returnDocument: "after", runValidators: true }
  ).lean().exec();
  if (!merchant) throw new ErrorHandler("Merchant not found", 404);
  return NextResponse.json({ merchant });
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await requireMerchantRole(request, ["owner", "admin", "manager", "staff"]);
  if (auth instanceof NextResponse) return auth;
  return getSettings(request, {});
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const auth = await requireMerchantRole(request, ["owner", "admin"]);
  if (auth instanceof NextResponse) return auth;
  return updateSettings(request, {});
}

export const dynamic = "force-dynamic";
