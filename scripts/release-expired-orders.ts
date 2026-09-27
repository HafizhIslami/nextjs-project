import mongoose from "mongoose";
import { InventoryMovement, InventoryResource, Order, Reservation } from "../backend/models/commerce";

const main = async () => {
  const uri = process.env.DB_URI?.trim() || process.env.DB_LOCAL_URI?.trim();
  if (!uri) throw new Error("DB_URI or DB_LOCAL_URI is required");
  await mongoose.connect(uri);

  const cutoff = new Date(Date.now() - 30 * 60 * 1000);
  const orders = await Order.find({
    status: "pending",
    paymentStatus: { $in: ["unpaid", "pending", "failed"] },
    createdAt: { $lt: cutoff },
  });

  let released = 0;
  for (const order of orders) {
    const movements = await InventoryMovement.aggregate([
      {
        $match: {
          merchantId: order.merchantId,
          referenceType: "order",
          referenceId: order._id,
          type: "reservation",
        },
      },
      { $group: { _id: "$inventoryResourceId", quantity: { $sum: "$quantity" } } },
    ]);

    for (const movement of movements) {
      const alreadyReleased = await InventoryMovement.exists({
        merchantId: order.merchantId,
        inventoryResourceId: movement._id,
        referenceType: "order",
        referenceId: order._id,
        type: "release",
      });
      if (alreadyReleased) continue;
      const stockResult = await InventoryResource.updateOne(
        {
          _id: movement._id,
          merchantId: order.merchantId,
          "stock.reserved": { $gte: movement.quantity },
        },
        { $inc: { "stock.reserved": -movement.quantity } }
      );
      if (stockResult.modifiedCount !== 1) continue;
      await InventoryMovement.create({
        merchantId: order.merchantId,
        inventoryResourceId: movement._id,
        type: "release",
        quantity: movement.quantity,
        referenceType: "order",
        referenceId: order._id,
        note: "Expired unpaid order",
      });
    }

    await Reservation.updateMany(
      { merchantId: order.merchantId, orderId: order._id, status: "held" },
      { $set: { status: "expired" } }
    );
    order.status = "cancelled";
    order.fulfillmentStatus = "cancelled";
    order.cancelledAt = new Date();
    await order.save();
    released += 1;
  }

  console.log(`Released ${released} expired unpaid order(s).`);
};

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => mongoose.disconnect());
