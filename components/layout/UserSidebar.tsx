"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const UserSidebar = () => {

  const pathName = usePathname()
  const menuItem = [
    { name: "Profile", url: "/me/update" },
    {
      name: "Profile photo",
      url: "/me/upload_avatar",
    },
    {
      name: "Password",
      url: "/me/update_password",
    },
  ];

  return (
    <nav className="list-group dashboard-nav" aria-label="Account settings sections">
      {menuItem.map((item) => (
        <Link
          key={item.url}
          href={item.url}
          className={`fw-bold list-group-item list-group-item-action ${
            pathName === item.url ? "active" : ""
          }`}
          aria-current={pathName === item.url ? "page" : undefined}
        >
          {item.name}
        </Link>
      ))}
    </nav>
  );
};

export default UserSidebar;
