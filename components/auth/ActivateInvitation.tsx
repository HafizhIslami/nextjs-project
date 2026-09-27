"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function ActivateInvitation({ token }: { token: string }) {
  const [password, setPassword] = useState(""); const [confirm, setConfirm] = useState(""); const [error, setError] = useState(""); const [done, setDone] = useState(false); const [loading, setLoading] = useState(false);
  const submit = async (event: FormEvent) => { event.preventDefault(); setError(""); if (password !== confirm) { setError("Passwords do not match"); return; } setLoading(true); const response = await fetch("/api/auth/activate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password }) }); const payload = await response.json(); setLoading(false); if (!response.ok) { setError(payload.errMessage || "Activation failed"); return; } setDone(true); };
  if (done) return <section className="activation-card"><span className="platform-success-mark">✓</span><h1>Account activated</h1><p>You can now sign in and manage your merchant website.</p><Link className="btn btn-primary-roomi" href="/login">Continue to login</Link></section>;
  return <form className="activation-card" onSubmit={submit}><span className="eyebrow">Merchant invitation</span><h1>Create your password</h1><p>Choose a private password to activate your owner account.</p><label>Password<input className="form-control" type="password" minLength={8} maxLength={128} value={password} onChange={(e) => setPassword(e.target.value)} required /></label><label>Confirm password<input className="form-control" type="password" minLength={8} maxLength={128} value={confirm} onChange={(e) => setConfirm(e.target.value)} required /></label>{error && <div className="platform-alert platform-alert-error" role="alert">{error}</div>}<button className="btn btn-primary-roomi" disabled={loading}>{loading ? "Activating…" : "Activate account"}</button></form>;
}

