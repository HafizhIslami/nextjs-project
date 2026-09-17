import AdminSidebar from "@/components/layout/AdminSidebar";
import React from "react";

interface Props {
  children: React.ReactNode;
}

const AdminLayout = ({ children }: Props) => {
  return (
    <div className="admin-shell">
      <header className="dashboard-page-header">
        <div className="container">
          <span className="eyebrow">Operations</span>
          <h1>Admin dashboard</h1>
          <p>Manage inventory, bookings, customers, and performance.</p>
        </div>
      </header>
      <div className="container admin-shell-grid">
        <div className="row justify-content-between">
          <aside className="col-12 col-lg-3" aria-label="Admin navigation">
            <AdminSidebar />
          </aside>
          <div className="col-12 col-lg-9 admin-dashboard-content">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
