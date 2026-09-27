"use client";

import { useEffect, useState } from "react";

type Log = { _id: string; action: string; targetType: string; merchantId?: string; createdAt: string; actorRole?: string; actorUserId?: { name: string; email: string } };

export default function PlatformAudit() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [error, setError] = useState("");
  useEffect(() => { fetch("/api/platform/audit-logs").then(async (response) => { const payload = await response.json(); if (!response.ok) throw new Error(payload.errMessage || "Unable to load audit log"); setLogs(payload.logs); }).catch((reason: Error) => setError(reason.message)); }, []);
  return <section className="platform-card"><div className="platform-section-heading"><div><span className="eyebrow">Security trail</span><h2>Platform audit log</h2></div></div>{error && <div className="platform-alert platform-alert-error" role="alert">{error}</div>}<div className="platform-table-wrap"><table className="platform-table"><thead><tr><th>Time</th><th>Actor</th><th>Action</th><th>Target</th></tr></thead><tbody>{logs.map((log) => <tr key={log._id}><td>{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(log.createdAt))}</td><td>{log.actorUserId?.name || "System"}<small>{log.actorRole}</small></td><td>{log.action}</td><td>{log.targetType}{log.merchantId ? ` · ${log.merchantId}` : ""}</td></tr>)}</tbody></table></div></section>;
}

