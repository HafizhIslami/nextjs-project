import UserSidebar from "@/components/layout/UserSidebar";
import React from "react";

interface Props {
  children: React.ReactNode;
}

const UserLayout = ({ children }: Props) => {
  return (
    <div className="account-settings-shell">
      <header className="dashboard-page-header">
        <div className="container">
          <span className="eyebrow">Your account</span>
          <h1>Account settings</h1>
          <p>Keep your profile and sign-in details up to date.</p>
        </div>
      </header>
      <div className="container admin-shell-grid">
        <div className="row justify-content-around">
          <aside className="col-12 col-lg-3" aria-label="Account settings navigation">
            <UserSidebar />
          </aside>
          <div className="col-12 col-lg-8 user-dashboard">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default UserLayout;
