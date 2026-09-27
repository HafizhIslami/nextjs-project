"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type OrderData = {
  _id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  currency: string;
  items: Array<{
    _id: string;
    nameSnapshot: string;
    quantity: number;
    totalMinor: number;
  }>;
  totals: { grandTotalMinor: number };
};

const money = (amount: number, currency: string) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "IDR" ? 0 : 2,
  }).format(currency === "IDR" ? amount : amount / 100);

export default function OrderDetailsClient({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<OrderData | null>(null);
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    fetch(`/api/orders/${orderId}`)
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.errMessage || payload.message || "Order could not be loaded.");
        setOrder(payload.order);
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Order could not be loaded."));
  }, [orderId]);

  const pay = async () => {
    setPaying(true);
    try {
      const response = await fetch(`/api/payment/orders/${orderId}/checkout`, { method: "POST" });
      const payload = await response.json();
      if (!response.ok || !payload.url) throw new Error(payload.errMessage || payload.message || "Checkout is unavailable.");
      window.location.assign(payload.url);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Checkout is unavailable.");
      setPaying(false);
    }
  };

  if (error) {
    return <div className="empty-state" role="alert"><h2>Unable to show this order</h2><p>{error}</p><Link href="/">Return to catalog</Link></div>;
  }
  if (!order) return <div className="order-loading" role="status">Loading order…</div>;

  return (
    <article className="order-summary-card">
      <div className="order-summary-heading">
        <div><span className="eyebrow">Order</span><h1>{order.orderNumber}</h1></div>
        <span className="order-status">{order.paymentStatus}</span>
      </div>
      <dl className="order-status-grid">
        <div><dt>Order status</dt><dd>{order.status}</dd></div>
        <div><dt>Fulfillment</dt><dd>{order.fulfillmentStatus}</dd></div>
      </dl>
      <ul className="order-line-items">
        {order.items.map((item) => (
          <li key={item._id}>
            <span>{item.nameSnapshot} × {item.quantity}</span>
            <strong>{money(item.totalMinor, order.currency)}</strong>
          </li>
        ))}
      </ul>
      <div className="order-total"><span>Total</span><strong>{money(order.totals.grandTotalMinor, order.currency)}</strong></div>
      {order.paymentStatus !== "paid" && order.status !== "cancelled" && (
        <button type="button" className="btn btn-primary-roomi" onClick={pay} disabled={paying}>
          {paying ? "Opening checkout…" : "Pay securely"}
        </button>
      )}
    </article>
  );
}
