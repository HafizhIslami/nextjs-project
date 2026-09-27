"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";

type Merchant = {
  _id: string;
  name: string;
  merchantCode: string;
  businessType?: string;
  status: string;
  primaryDomain?: { hostname: string; sslStatus: string };
  metrics: { owners: number; orders: number; customers: number };
};

export default function MerchantDirectory() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (status) params.set("status", status);
    const response = await fetch(`/api/platform/merchants?${params}`);
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.errMessage || "Unable to load merchants");
    setMerchants(payload.merchants);
  }, [query, status]);
  useEffect(() => { load().catch((reason: Error) => setError(reason.message)); }, [load]);
  const submit = (event: FormEvent) => { event.preventDefault(); load().catch((reason: Error) => setError(reason.message)); };
  return (
    <section className="platform-card">
      <div className="platform-section-heading">
        <div><span className="eyebrow">Tenant directory</span><h2>Merchants</h2></div>
        <Link href="/platform/merchants/new" className="btn btn-primary-roomi">Create merchant</Link>
      </div>
      <form className="platform-filters" onSubmit={submit}>
        <label>Search<input className="form-control" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name or merchant code" /></label>
        <label>Status<select className="form-select" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All</option><option value="active">Active</option><option value="suspended">Suspended</option><option value="archived">Archived</option></select></label>
        <button className="btn btn-outline-secondary" type="submit">Apply filters</button>
      </form>
      {error && <div className="platform-alert platform-alert-error" role="alert">{error}</div>}
      <div className="platform-table-wrap">
        <table className="platform-table">
          <thead><tr><th>Merchant</th><th>Website</th><th>Type</th><th>Usage</th><th>Status</th></tr></thead>
          <tbody>{merchants.map((merchant) => (
            <tr key={merchant._id}>
              <td><Link href={`/platform/merchants/${merchant._id}`}><strong>{merchant.name}</strong><small>{merchant.merchantCode}</small></Link></td>
              <td>{merchant.primaryDomain?.hostname || "Pending"}<small>TLS {merchant.primaryDomain?.sslStatus || "pending"}</small></td>
              <td>{merchant.businessType || "general"}</td>
              <td>{merchant.metrics.orders} orders · {merchant.metrics.customers} customers</td>
              <td><span className={`platform-status status-${merchant.status}`}>{merchant.status}</span></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </section>
  );
}

