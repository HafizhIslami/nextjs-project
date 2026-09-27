"use client";

import { FormEvent, useEffect, useState } from "react";
import toast from "react-hot-toast";

type Offering = { _id: string; code: string; name: string; type: string; status: string; pricing: { baseAmountMinor?: number; currency: string } };
type Channel = { _id: string; code: string; name: string };

export default function OfferingsManager() {
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [offeringResponse, channelResponse] = await Promise.all([
      fetch("/api/admin/offerings"),
      fetch("/api/admin/channels"),
    ]);
    if (!offeringResponse.ok || !channelResponse.ok) throw new Error("Catalog administration could not be loaded.");
    setOfferings((await offeringResponse.json()).offerings);
    setChannels((await channelResponse.json()).channels);
  };

  useEffect(() => {
    load().catch((error: unknown) => toast.error(error instanceof Error ? error.message : "Unable to load catalog."))
      .finally(() => setLoading(false));
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    const form = new FormData(event.currentTarget);
    try {
      const amountMinor = Number(form.get("amountMinor"));
      const response = await fetch("/api/admin/offerings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.get("code"),
          name: form.get("name"),
          description: form.get("description"),
          shortDescription: form.get("shortDescription"),
          type: form.get("type"),
          status: "active",
          pricing: {
            model: form.get("pricingModel"),
            baseAmountMinor: form.get("pricingModel") === "quote" ? undefined : amountMinor,
          },
          inventory: { mode: "none", trackInventory: false, allowBackorder: false },
          media: [],
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.errMessage || payload.message || "Offering could not be created.");

      const channelId = String(form.get("channelId") || "");
      if (channelId) {
        const listingResponse = await fetch("/api/admin/channel-listings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            offeringId: payload.offering._id,
            channelId,
            visible: true,
            purchasable: form.get("pricingModel") !== "quote",
            minimumQuantity: Number(form.get("minimumQuantity") || 1),
          }),
        });
        if (!listingResponse.ok) throw new Error("Offering was created but could not be published to the channel.");
      }
      toast.success("Offering created and published.");
      event.currentTarget.reset();
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Offering could not be created.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="merchant-admin-stack">
      <section className="admin-panel-card">
        <h2>Create an offering</h2>
        <form className="merchant-offering-form" onSubmit={submit}>
          <label>Code<input className="form-control" name="code" required maxLength={80} /></label>
          <label>Name<input className="form-control" name="name" required maxLength={200} /></label>
          <label className="form-span-2">Short description<input className="form-control" name="shortDescription" maxLength={300} /></label>
          <label className="form-span-2">Description<textarea className="form-control" name="description" rows={4} required /></label>
          <label>Type<select className="form-select" name="type" defaultValue="physical"><option value="physical">Physical product</option><option value="service">Service</option><option value="rental">Rental</option><option value="custom">Custom / quotation</option></select></label>
          <label>Pricing<select className="form-select" name="pricingModel" defaultValue="fixed"><option value="fixed">Fixed</option><option value="per_unit">Per unit</option><option value="per_duration">Per duration</option><option value="quote">Quotation</option></select></label>
          <label>Amount (smallest unit)<input className="form-control" name="amountMinor" type="number" min="0" defaultValue="0" /></label>
          <label>Minimum quantity<input className="form-control" name="minimumQuantity" type="number" min="1" defaultValue="1" /></label>
          <label className="form-span-2">Publish to<select className="form-select" name="channelId" required><option value="">Select channel</option>{channels.map((channel) => <option value={channel._id} key={channel._id}>{channel.name}</option>)}</select></label>
          <button className="btn btn-primary-roomi form-span-2" type="submit" disabled={saving}>{saving ? "Saving…" : "Create offering"}</button>
        </form>
      </section>

      <section className="admin-panel-card">
        <h2>Offerings</h2>
        {loading ? <p>Loading catalog…</p> : offerings.length === 0 ? <p>No offerings yet.</p> : (
          <div className="table-responsive"><table className="table align-middle"><thead><tr><th>Code</th><th>Name</th><th>Type</th><th>Status</th><th>Base price</th></tr></thead><tbody>{offerings.map((offering) => <tr key={offering._id}><td>{offering.code}</td><td>{offering.name}</td><td>{offering.type}</td><td>{offering.status}</td><td>{offering.pricing.baseAmountMinor ?? "Quote"}</td></tr>)}</tbody></table></div>
        )}
      </section>
    </div>
  );
}
