import dbConnect from "@/backend/config/dbConnect";
import { Order } from "@/backend/models/commerce";
import { catchAsyncErrors } from "@/backend/middlewares/catchAsyncErrors";
import { requireUser } from "@/backend/middlewares/routeAuth";
import { createPricedOrder } from "@/backend/services/orderService";
import { requireTenantContext } from "@/backend/tenancy/requestTenant";
import { tenantFilter } from "@/backend/tenancy/scope";
import { NextRequest, NextResponse } from "next/server";

const createOrder = catchAsyncErrors(async (request: NextRequest) => {
  await dbConnect({ throwOnError: true });
  const tenant = await requireTenantContext(request);
  const body = await request.json();
  const order = await createPricedOrder({
    tenant,
    user: request.user,
    channelCode: typeof body?.channelCode === "string" ? body.channelCode : "retail",
    rawItems: body?.items,
  });
  return NextResponse.json({ order }, { status: 201 });
});

const listOrders = catchAsyncErrors(async (request: NextRequest) => {
  await dbConnect({ throwOnError: true });
  const tenant = await requireTenantContext(request);
  const orders = await Order.find(tenantFilter(tenant, { "customerSnapshot.email": request.user.email }))
    .sort({ createdAt: -1 })
    .lean()
    .exec();
  return NextResponse.json({ orders });
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await requireUser(request);
  if (auth instanceof NextResponse) return auth;
  return listOrders(request, {});
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireUser(request);
  if (auth instanceof NextResponse) return auth;
  return createOrder(request, {});
}

export const dynamic = "force-dynamic";
