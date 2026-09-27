"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

type Data = {
  merchant: { _id: string; name: string; merchantCode: string; legalName?: string; status: string; businessType?: string; enabledModules: string[]; suspensionReason?: string };
  domains: Array<{ _id: string; hostname: string; status: string; sslStatus: string; isPrimary: boolean }>;
  members: Array<{ _id: string; role: string; status: string; userId: { name: string; email: string; accountStatus: string } }>;
  channels: Array<{ _id: string; name: string; code: string; status: string }>;
};

export default function MerchantRecord({ id }: { id: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => { const response = await fetch(`/api/platform/merchants/${id}`); const payload = await response.json(); if (!response.ok) throw new Error(payload.errMessage || "Unable to load merchant"); setData(payload); }, [id]);
  useEffect(() => { load().catch((reason: Error) => setError(reason.message)); }, [load]);
  const changeStatus = async (status: string) => {
    const reason = status === "suspended" ? window.prompt("Reason for suspension") || "Suspended by platform operator" : undefined;
    if (status === "archived" && !window.confirm("Archive this merchant? The website will become unavailable.")) return;
    const response = await fetch(`/api/platform/merchants/${id}/status`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, reason }) });
    const payload = await response.json(); if (!response.ok) { toast.error(payload.errMessage || "Status update failed"); return; } toast.success(`Merchant ${status}`); await load();
  };
  const resend = async () => { const response = await fetch(`/api/platform/merchants/${id}/invite-owner`, { method: "POST" }); const payload = await response.json(); if (!response.ok) { toast.error(payload.errMessage || "Invitation failed"); return; } if (payload.activationUrl) await navigator.clipboard?.writeText(payload.activationUrl); toast.success(payload.activationUrl ? "Invitation refreshed; local link copied" : `Invitation ${payload.delivery}`); };
  if (error) return <div className="platform-alert platform-alert-error" role="alert">{error}</div>;
  if (!data) return <div className="platform-card" role="status">Loading merchant…</div>;
  const ownerPending = data.members.some((member) => member.role === "owner" && member.status === "invited");
  return <div className="platform-stack">
    <section className="platform-card merchant-record-header"><div><span className="eyebrow">{data.merchant.merchantCode}</span><h2>{data.merchant.name}</h2><p>{data.merchant.businessType || "General commerce"}</p></div><div><span className={`platform-status status-${data.merchant.status}`}>{data.merchant.status}</span><div className="platform-actions">{data.merchant.status !== "active" && <button className="btn btn-primary-roomi" onClick={() => changeStatus("active")}>Activate</button>}{data.merchant.status === "active" && <button className="btn btn-outline-secondary" onClick={() => changeStatus("suspended")}>Suspend</button>}{data.merchant.status !== "archived" && <button className="btn btn-outline-danger" onClick={() => changeStatus("archived")}>Archive</button>}</div></div></section>
    {data.merchant.suspensionReason && <div className="platform-alert"><strong>Suspension reason:</strong> {data.merchant.suspensionReason}</div>}
    <div className="platform-two-column"><section className="platform-card"><h3>Domains</h3><ul className="platform-detail-list">{data.domains.map((domain) => <li key={domain._id}><span><strong>{domain.hostname}</strong><small>{domain.isPrimary ? "Primary" : "Custom"}</small></span><span>{domain.status} · TLS {domain.sslStatus}</span></li>)}</ul></section><section className="platform-card"><div className="platform-section-heading"><h3>Team</h3>{ownerPending && <button className="btn btn-sm btn-outline-secondary" onClick={resend}>Resend owner invite</button>}</div><ul className="platform-detail-list">{data.members.map((member) => <li key={member._id}><span><strong>{member.userId?.name}</strong><small>{member.userId?.email}</small></span><span>{member.role} · {member.status}</span></li>)}</ul></section></div>
    <section className="platform-card"><h3>Commerce setup</h3><p><strong>Modules:</strong> {data.merchant.enabledModules.join(", ")}</p><div className="platform-chip-list">{data.channels.map((channel) => <span key={channel._id}>{channel.name} · {channel.status}</span>)}</div></section>
  </div>;
}
