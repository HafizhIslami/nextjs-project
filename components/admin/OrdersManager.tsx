"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

type Order = {
  _id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  currency: string;
  customerSnapshot: { name: string; email?: string };
  totals: { grandTotalMinor: number };
};

export default function OrdersManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => fetch("/api/admin/orders").then(async (response) => {
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.errMessage || payload.message || "Orders could not be loaded.");
    setOrders(payload.orders);
  });

  useEffect(() => {
    load().catch((error: unknown) => toast.error(error instanceof Error ? error.message : "Orders could not be loaded."))
      .finally(() => setLoading(false));
  }, []);

  const update = async (orderId: string, status: string) => {
    const response = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, status }),
    });
    const payload = await response.json();
    if (!response.ok) return toast.error(payload.errMessage || payload.message || "Order could not be updated.");
    toast.success("Order status updated.");
    await load();
  };

  return (
    <section className="admin-panel-card">
      <h2>Commerce orders</h2>
      {loading ? <p>Loading orders…</p> : orders.length === 0 ? <p>No commerce orders yet.</p> : (
        <div className="table-responsive"><table className="table align-middle"><thead><tr><th>Order</th><th>Customer</th><th>Payment</th><th>Fulfillment</th><th>Total</th><th>Status</th></tr></thead><tbody>{orders.map((order) => (
          <tr key={order._id}>
            <td><strong>{order.orderNumber}</strong></td>
            <td>{order.customerSnapshot.name}<small className="d-block text-muted">{order.customerSnapshot.email}</small></td>
            <td>{order.paymentStatus}</td><td>{order.fulfillmentStatus}</td><td>{order.totals.grandTotalMinor} {order.currency}</td>
            <td><select className="form-select form-select-sm" value={order.status} onChange={(event) => update(order._id, event.target.value)}><option value="pending" disabled>Pending</option><option value="confirmed">Confirmed</option><option value="processing">Processing</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></td>
          </tr>
        ))}</tbody></table></div>
      )}
    </section>
  );
}
