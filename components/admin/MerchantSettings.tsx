"use client";

import { FormEvent, useEffect, useState } from "react";
import toast from "react-hot-toast";

type MerchantData = {
  name: string;
  branding: { logoUrl?: string; primaryColor: string; secondaryColor: string; accentColor: string };
};
type DomainData = { _id: string; hostname: string; status: string; sslStatus: string; isPrimary: boolean };

export default function MerchantSettings() {
  const [merchant, setMerchant] = useState<MerchantData | null>(null);
  const [domains, setDomains] = useState<DomainData[]>([]);
  const [dns, setDns] = useState<{ hostname: string; name: string; value: string } | null>(null);

  const load = async () => {
    const [merchantResponse, domainResponse] = await Promise.all([
      fetch("/api/admin/merchant-settings"),
      fetch("/api/admin/domains"),
    ]);
    if (!merchantResponse.ok || !domainResponse.ok) throw new Error("Merchant settings could not be loaded.");
    setMerchant((await merchantResponse.json()).merchant);
    setDomains((await domainResponse.json()).domains);
  };

  useEffect(() => {
    load().catch((error: unknown) => toast.error(error instanceof Error ? error.message : "Unable to load settings."));
  }, []);

  const saveBranding = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/merchant-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form)),
    });
    const payload = await response.json();
    if (!response.ok) return toast.error(payload.errMessage || payload.message || "Settings could not be saved.");
    setMerchant(payload.merchant);
    toast.success("Branding updated.");
    window.location.reload();
  };

  const addDomain = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const hostname = String(form.get("hostname") || "");
    const response = await fetch("/api/admin/domains", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hostname }),
    });
    const payload = await response.json();
    if (!response.ok) return toast.error(payload.errMessage || payload.message || "Domain could not be added.");
    setDns({ hostname: payload.domain.hostname, name: payload.dns.name, value: payload.dns.value });
    toast.success("Domain added. Create the DNS TXT record shown below.");
    await load();
  };

  const verifyDomain = async () => {
    if (!dns) return;
    const response = await fetch("/api/admin/domains/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hostname: dns.hostname, token: dns.value }),
    });
    const payload = await response.json();
    if (!response.ok) return toast.error(payload.errMessage || payload.message || "DNS is not verified yet.");
    toast.success("Domain verified.");
    setDns(null);
    await load();
  };

  if (!merchant) return <div className="admin-panel-card" role="status">Loading merchant settings…</div>;

  return (
    <div className="merchant-admin-stack">
      <section className="admin-panel-card">
        <h2>Branding</h2>
        <form className="merchant-offering-form" onSubmit={saveBranding}>
          <label className="form-span-2">Merchant name<input className="form-control" name="name" defaultValue={merchant.name} required /></label>
          <label className="form-span-2">Logo URL<input className="form-control" name="logoUrl" defaultValue={merchant.branding.logoUrl || ""} /></label>
          <label>Primary color<input className="form-control form-control-color" name="primaryColor" type="color" defaultValue={merchant.branding.primaryColor} /></label>
          <label>Secondary color<input className="form-control form-control-color" name="secondaryColor" type="color" defaultValue={merchant.branding.secondaryColor} /></label>
          <label>Accent color<input className="form-control form-control-color" name="accentColor" type="color" defaultValue={merchant.branding.accentColor} /></label>
          <button className="btn btn-primary-roomi form-span-2" type="submit">Save branding</button>
        </form>
      </section>

      <section className="admin-panel-card">
        <h2>Domains</h2>
        <ul className="merchant-domain-list">{domains.map((domain) => (
          <li key={domain._id}><span><strong>{domain.hostname}</strong>{domain.isPrimary && <small>Primary</small>}</span><span>{domain.status} · TLS {domain.sslStatus}</span></li>
        ))}</ul>
        <form className="merchant-domain-form" onSubmit={addDomain}>
          <label>Custom domain<input className="form-control" name="hostname" placeholder="shop.example.com" required /></label>
          <button className="btn btn-outline-secondary" type="submit">Add domain</button>
        </form>
        {dns && (
          <div className="dns-instructions" role="status">
            <strong>Create this DNS TXT record</strong>
            <code>{dns.name}</code>
            <code>{dns.value}</code>
            <button type="button" className="btn btn-primary-roomi" onClick={verifyDomain}>Verify DNS</button>
          </div>
        )}
      </section>
    </div>
  );
}
