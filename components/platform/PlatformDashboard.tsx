"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Merchant = {
  _id: string;
  name: string;
  merchantCode: string;
  status: string;
  createdAt: string;
  primaryDomain?: { hostname: string; sslStatus: string };
  metrics: { owners: number; orders: number; customers: number };
};

export default function PlatformDashboard() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/platform/merchants")
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.errMessage || "Unable to load merchants");
        setMerchants(payload.merchants);
      })
      .catch((reason: Error) => setError(reason.message));
  }, []);
  const totals = useMemo(() => ({
    active: merchants.filter((merchant) => merchant.status === "active").length,
    suspended: merchants.filter((merchant) => merchant.status === "suspended").length,
    orders: merchants.reduce((total, merchant) => total + merchant.metrics.orders, 0),
    customers: merchants.reduce((total, merchant) => total + merchant.metrics.customers, 0),
  }), [merchants]);

  if (error) return <div className="platform-alert platform-alert-error" role="alert">{error}</div>;
  return (
    <div className="platform-stack">
      <section className="platform-metrics" aria-label="Platform metrics">
        <article><span>Merchants</span><strong>{merchants.length}</strong></article>
        <article><span>Active</span><strong>{totals.active}</strong></article>
        <article><span>Suspended</span><strong>{totals.suspended}</strong></article>
        <article><span>Total orders</span><strong>{totals.orders}</strong></article>
        <article><span>Customers</span><strong>{totals.customers}</strong></article>
      </section>
      <section className="platform-card">
        <div className="platform-section-heading">
          <div><span className="eyebrow">Portfolio</span><h2>Newest merchants</h2></div>
          <Link href="/platform/merchants/new" className="btn btn-primary-roomi">Create merchant</Link>
        </div>
        <div className="platform-table-wrap">
          <table className="platform-table">
            <thead><tr><th>Merchant</th><th>Hostname</th><th>Status</th><th>Orders</th></tr></thead>
            <tbody>{merchants.slice(0, 8).map((merchant) => (
              <tr key={merchant._id}>
                <td><Link href={`/platform/merchants/${merchant._id}`}><strong>{merchant.name}</strong><small>{merchant.merchantCode}</small></Link></td>
                <td>{merchant.primaryDomain?.hostname || "Pending"}</td>
                <td><span className={`platform-status status-${merchant.status}`}>{merchant.status}</span></td>
                <td>{merchant.metrics.orders}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

