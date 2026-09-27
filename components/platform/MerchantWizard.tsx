"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";

type Result = {
  merchant: { _id: string; name: string; merchantCode: string };
  domain?: { hostname: string };
  ownerInvited: boolean;
  invitationDelivery: string;
  activationUrl?: string;
};

const steps = ["Identity", "Owner", "Commerce", "Branding", "Review"];

export default function MerchantWizard() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [form, setForm] = useState({
    name: "", merchantCode: "", legalName: "", businessType: "general",
    ownerName: "", ownerEmail: "", currency: "IDR", locale: "id-ID", timezone: "Asia/Jakarta",
    retail: true, reseller: true, catalog: true, commerce: true, inventory: true, rental: false, quotation: false,
    primaryColor: "#a7194b", secondaryColor: "#23191f", accentColor: "#f6dce6",
  });
  const hostname = useMemo(() => `${form.merchantCode || "merchant"}.${typeof window === "undefined" ? "platform" : window.location.hostname}`, [form.merchantCode]);
  const update = (name: string, value: string | boolean) => setForm((current) => ({ ...current, [name]: value }));
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (step < steps.length - 1) { setStep((current) => current + 1); return; }
    setLoading(true); setError("");
    const idempotencyKey = crypto.randomUUID();
    try {
      const response = await fetch("/api/platform/merchants", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
        body: JSON.stringify({
          ...form,
          channels: [form.retail && "retail", form.reseller && "reseller"].filter(Boolean),
          modules: [form.catalog && "catalog", form.commerce && "commerce", form.inventory && "inventory", form.rental && "rental", form.quotation && "quotation"].filter(Boolean),
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(Array.isArray(payload.errMessage) ? payload.errMessage.join(", ") : payload.errMessage || "Merchant provisioning failed");
      setResult(payload);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Merchant provisioning failed");
    } finally { setLoading(false); }
  };
  if (result) return (
    <section className="platform-card platform-success" aria-live="polite">
      <span className="platform-success-mark">✓</span><span className="eyebrow">Provisioning complete</span>
      <h2>{result.merchant.name} is ready</h2>
      <p>The tenant boundary, hostname, owner membership, channels, and price lists were created.</p>
      <dl><div><dt>Website</dt><dd>{result.domain?.hostname}</dd></div><div><dt>Owner</dt><dd>{result.ownerInvited ? `Invitation ${result.invitationDelivery}` : "Existing account connected"}</dd></div></dl>
      {result.activationUrl && <div className="platform-alert"><strong>Local activation link</strong><code>{result.activationUrl}</code></div>}
      <div className="platform-actions"><Link className="btn btn-primary-roomi" href={`/platform/merchants/${result.merchant._id}`}>Open merchant record</Link><a className="btn btn-outline-secondary" href={`${window.location.protocol}//${result.domain?.hostname}${window.location.port ? `:${window.location.port}` : ""}`}>Open website</a></div>
    </section>
  );
  return (
    <form className="platform-card merchant-wizard" onSubmit={submit}>
      <ol className="wizard-steps">{steps.map((label, index) => <li key={label} className={index === step ? "active" : index < step ? "complete" : ""}><span>{index + 1}</span>{label}</li>)}</ol>
      {step === 0 && <fieldset><legend>Merchant identity</legend><div className="platform-form-grid">
        <label>Display name<input className="form-control" required value={form.name} onChange={(e) => update("name", e.target.value)} /></label>
        <label>Merchant code<input className="form-control" required pattern="[a-z0-9][a-z0-9-]*[a-z0-9]|[a-z0-9]" value={form.merchantCode} onChange={(e) => update("merchantCode", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} /><small>{hostname}</small></label>
        <label>Legal name<input className="form-control" value={form.legalName} onChange={(e) => update("legalName", e.target.value)} /></label>
        <label>Business template<select className="form-select" value={form.businessType} onChange={(e) => update("businessType", e.target.value)}><option value="general">General commerce</option><option value="physical-products">Physical products</option><option value="services">Services</option><option value="rental-reservation">Rental / reservation</option><option value="accommodation">Accommodation</option></select></label>
      </div></fieldset>}
      {step === 1 && <fieldset><legend>Client owner</legend><p>The owner receives access only to this merchant.</p><div className="platform-form-grid"><label>Owner name<input className="form-control" required value={form.ownerName} onChange={(e) => update("ownerName", e.target.value)} /></label><label>Owner email<input className="form-control" type="email" required value={form.ownerEmail} onChange={(e) => update("ownerEmail", e.target.value)} /></label></div></fieldset>}
      {step === 2 && <fieldset><legend>Commerce configuration</legend><div className="platform-form-grid"><label>Currency<input className="form-control" maxLength={3} required value={form.currency} onChange={(e) => update("currency", e.target.value.toUpperCase())} /></label><label>Locale<input className="form-control" required value={form.locale} onChange={(e) => update("locale", e.target.value)} /></label><label>Timezone<input className="form-control" required value={form.timezone} onChange={(e) => update("timezone", e.target.value)} /></label></div><div className="platform-check-grid">{(["retail", "reseller", "catalog", "commerce", "inventory", "rental", "quotation"] as const).map((name) => <label key={name}><input type="checkbox" checked={form[name]} disabled={name === "catalog"} onChange={(e) => update(name, e.target.checked)} /> {name}</label>)}</div></fieldset>}
      {step === 3 && <fieldset><legend>Initial branding</legend><div className="platform-form-grid platform-color-grid"><label>Primary<input type="color" value={form.primaryColor} onChange={(e) => update("primaryColor", e.target.value)} /></label><label>Secondary<input type="color" value={form.secondaryColor} onChange={(e) => update("secondaryColor", e.target.value)} /></label><label>Accent<input type="color" value={form.accentColor} onChange={(e) => update("accentColor", e.target.value)} /></label></div></fieldset>}
      {step === 4 && <fieldset><legend>Review provisioning</legend><dl className="platform-review"><div><dt>Merchant</dt><dd>{form.name} ({form.merchantCode})</dd></div><div><dt>Owner</dt><dd>{form.ownerName} · {form.ownerEmail}</dd></div><div><dt>Business</dt><dd>{form.businessType} · {form.currency}</dd></div><div><dt>Channels</dt><dd>{[form.retail && "retail", form.reseller && "reseller"].filter(Boolean).join(", ")}</dd></div></dl></fieldset>}
      {error && <div className="platform-alert platform-alert-error" role="alert">{error}</div>}
      <div className="wizard-actions">{step > 0 && <button type="button" className="btn btn-outline-secondary" onClick={() => setStep((current) => current - 1)}>Back</button>}<button type="submit" className="btn btn-primary-roomi" disabled={loading}>{loading ? "Provisioning…" : step === steps.length - 1 ? "Create merchant" : "Continue"}</button></div>
    </form>
  );
}
