"use client";

import { useState } from "react";
import toast from "react-hot-toast";

export default function ResellerApplication({ requested }: { requested: boolean }) {
  const [pending, setPending] = useState(requested);
  const [loading, setLoading] = useState(false);

  const apply = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/reseller/apply", { method: "POST" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.errMessage || payload.message || "Application failed.");
      setPending(true);
      toast.success("Your reseller application was submitted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Application failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reseller-access-card">
      <span className="eyebrow">Reseller channel</span>
      <h1>{pending ? "Application under review" : "Grow with reseller pricing"}</h1>
      <p>{pending
        ? "The merchant will review your account before private products and pricing become available."
        : "Apply for access to minimum-order rules, private products, and reseller pricing."
      }</p>
      {!pending && (
        <button type="button" className="btn btn-primary-roomi" onClick={apply} disabled={loading}>
          {loading ? "Submitting…" : "Request reseller access"}
        </button>
      )}
    </div>
  );
}
