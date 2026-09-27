"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

type Customer = {
  _id: string;
  customerCode: string;
  name: string;
  email?: string;
  status: string;
  reseller?: { requested?: boolean; approved?: boolean };
};

export default function CustomersManager() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => fetch("/api/admin/customers")
    .then(async (response) => {
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.errMessage || payload.message || "Customers could not be loaded.");
      setCustomers(payload.customers);
    });

  useEffect(() => {
    load().catch((error: unknown) => toast.error(error instanceof Error ? error.message : "Customers could not be loaded."))
      .finally(() => setLoading(false));
  }, []);

  const setApproval = async (customerId: string, approved: boolean) => {
    const response = await fetch("/api/admin/customers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId, approved }),
    });
    const payload = await response.json();
    if (!response.ok) {
      toast.error(payload.errMessage || payload.message || "Customer could not be updated.");
      return;
    }
    toast.success(approved ? "Reseller approved." : "Reseller access removed.");
    await load();
  };

  return (
    <section className="admin-panel-card">
      <h2>Merchant customers</h2>
      {loading ? <p>Loading customers…</p> : customers.length === 0 ? <p>No customers yet.</p> : (
        <div className="table-responsive">
          <table className="table align-middle">
            <thead><tr><th>Customer</th><th>Status</th><th>Reseller</th><th><span className="visually-hidden">Actions</span></th></tr></thead>
            <tbody>{customers.map((customer) => (
              <tr key={customer._id}>
                <td><strong>{customer.name}</strong><small className="d-block text-muted">{customer.email || customer.customerCode}</small></td>
                <td>{customer.status}</td>
                <td>{customer.reseller?.approved ? "Approved" : customer.reseller?.requested ? "Requested" : "No"}</td>
                <td className="text-end">
                  {customer.reseller?.requested && (
                    <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setApproval(customer._id, !customer.reseller?.approved)}>
                      {customer.reseller?.approved ? "Remove access" : "Approve"}
                    </button>
                  )}
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </section>
  );
}
