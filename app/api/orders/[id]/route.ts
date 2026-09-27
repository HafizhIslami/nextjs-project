import dbConnect from "@/backend/config/dbConnect";
import { Order } from "@/backend/models/commerce";
import { Customer } from "@/backend/models/merchantIdentity";
import { catchAsyncErrors } from "@/backend/middlewares/catchAsyncErrors";
import { requireUser } from "@/backend/middlewares/routeAuth";
import { requireTenantContext } from "@/backend/tenancy/requestTenant";
import ErrorHandler from "@/backend/utils/errorHandler";
import { requireObjectId } from "@/backend/utils/validation";
import { NextRequest, NextResponse } from "next/server";

type Context = { params: { id: string } };

const detail = catchAsyncErrors(async (request: NextRequest, { params }: Context) => {
  await dbConnect({ throwOnError: true });
  const tenant = await requireTenantContext(request);
  const orderId = requireObjectId(params.id, "order ID");
  const customer = await Customer.findOne({ merchantId: tenant.merchantId, userId: request.user._id })
    .select({ _id: 1 })
    .lean()
    .exec();
  const order = customer
    ? await Order.findOne({ _id: orderId, merchantId: tenant.merchantId, customerId: customer._id }).lean().exec()
    : null;
  if (!order) throw new ErrorHandler("Order not found", 404);
  return NextResponse.json({ order });
});

export async function GET(request: NextRequest, context: Context): Promise<NextResponse> {
  const auth = await requireUser(request);
  if (auth instanceof NextResponse) return auth;
  return detail(request, context);
}

export const dynamic = "force-dynamic";
