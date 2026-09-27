"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function PurchasePanel({
  offeringId,
  offeringType,
  pricingModel,
  minimumQuantity,
  purchasable,
}: {
  offeringId: string;
  offeringType: string;
  pricingModel: string;
  minimumQuantity: number;
  purchasable: boolean;
}) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(minimumQuantity);
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const needsDates = pricingModel === "per_duration" || offeringType === "rental" || offeringType === "service";
  const needsQuote = pricingModel === "quote" || offeringType === "custom" || !purchasable;

  const parseResponse = async (response: Response) => {
    const payload = await response.json().catch(() => ({}));
    if (response.status === 401) {
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      throw new Error("Please log in to continue.");
    }
    if (!response.ok) throw new Error(payload.errMessage || payload.message || "The request could not be completed.");
    return payload;
  };

  const submit = async () => {
    setLoading(true);
    try {
      if (needsQuote) {
        const response = await fetch("/api/quotations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ offeringId, quantity, description: details || "Please provide a quotation." }),
        });
        const payload = await parseResponse(response);
        toast.success(`Request ${payload.quotation.quotationNumber} was submitted.`);
        return;
      }

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelCode: "retail",
          items: [{ offeringId, quantity, startAt: startAt || undefined, endAt: endAt || undefined }],
        }),
      });
      const payload = await parseResponse(response);
      const checkoutResponse = await fetch(`/api/payment/orders/${payload.order._id}/checkout`, { method: "POST" });
      const checkout = await parseResponse(checkoutResponse);
      if (!checkout.url) throw new Error("Checkout URL was not returned.");
      window.location.assign(checkout.url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The request could not be completed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="purchase-panel">
      <label>
        Quantity
        <input
          className="form-control"
          type="number"
          min={minimumQuantity}
          value={quantity}
          onChange={(event) => setQuantity(Math.max(minimumQuantity, Number(event.target.value)))}
        />
      </label>
      {needsDates && !needsQuote && (
        <div className="purchase-date-grid">
          <label>
            Start
            <input className="form-control" type="datetime-local" value={startAt} onChange={(event) => setStartAt(event.target.value)} required />
          </label>
          <label>
            End
            <input className="form-control" type="datetime-local" value={endAt} onChange={(event) => setEndAt(event.target.value)} required />
          </label>
        </div>
      )}
      {needsQuote && (
        <label>
          What do you need?
          <textarea className="form-control" rows={4} value={details} onChange={(event) => setDetails(event.target.value)} />
        </label>
      )}
      <button type="button" className="btn btn-primary-roomi" onClick={submit} disabled={loading || (needsDates && !needsQuote && (!startAt || !endAt))}>
        {loading ? "Please wait…" : needsQuote ? "Request quote" : "Continue to payment"}
      </button>
    </div>
  );
}
