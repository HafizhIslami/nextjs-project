import dbConnect from "@/backend/config/dbConnect";
import { InventoryMovement, InventoryResource, Order, Reservation } from "@/backend/models/commerce";
import { catchAsyncErrors } from "@/backend/middlewares/catchAsyncErrors";
import { requireMerchantRole } from "@/backend/middlewares/routeAuth";
import { requireTenantContext } from "@/backend/tenancy/requestTenant";
import ErrorHandler from "@/backend/utils/errorHandler";
import { requireObjectId } from "@/backend/utils/validation";
import { NextRequest, NextResponse } from "next/server";

const list = catchAsyncErrors(async (request: NextRequest) => {
  await dbConnect({ throwOnError: true });
  const tenant = await requireTenantContext(request);
  const orders = await Order.find({ merchantId: tenant.merchantId })
    .sort({ createdAt: -1 })
    .limit(250)
    .lean()
    .exec();
  return NextResponse.json({ orders });
});

const update = catchAsyncErrors(async (request: NextRequest) => {
  await dbConnect({ throwOnError: true });
  const tenant = await requireTenantContext(request);
  const body = await request.json();
  const orderId = requireObjectId(body?.orderId, "order ID");
  const status = body?.status;
  if (!["confirmed", "processing", "completed", "cancelled"].includes(status)) {
    throw new ErrorHandler("Invalid order status", 400);
  }
  const order = await Order.findOne({ _id: orderId, merchantId: tenant.merchantId });
  if (!order) throw new ErrorHandler("Order not found", 404);
  if (status === "cancelled" && order.paymentStatus === "paid") {
    throw new ErrorHandler("Refund a paid order before cancelling it", 409);
  }
  if (status === "cancelled" && order.status !== "cancelled") {
    const stockReservations = await InventoryMovement.find({
      merchantId: tenant.merchantId,
      referenceType: "order",
      referenceId: order._id,
      type: "reservation",
    }).lean().exec();
    await Promise.all(stockReservations.map((movement) =>
      InventoryResource.updateOne(
        { _id: movement.inventoryResourceId, merchantId: tenant.merchantId },
        { $inc: { "stock.reserved": -movement.quantity } }
      )
    ));
    await Reservation.updateMany(
      { merchantId: tenant.merchantId, orderId: order._id, status: { $in: ["held", "confirmed"] } },
      { $set: { status: "cancelled" } }
    );
  }
  order.status = status;
  if (status === "completed") {
    order.fulfillmentStatus = "fulfilled";
    order.completedAt = new Date();
  } else if (status === "processing") {
    order.fulfillmentStatus = "processing";
  } else if (status === "cancelled") {
    order.fulfillmentStatus = "cancelled";
    order.cancelledAt = new Date();
  }
  await order.save();
  return NextResponse.json({ order });
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
