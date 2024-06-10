"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";

interface Props {
  data: any;
}

const UserSidebar = () => {

  const pathName = usePathname()
  const menuItem = [
    { name: "Update Profile", url: "/me/update", icon: "fas fa-user" },
    {
      name: "Upload Avatar",
      url: "/me/upload_avatar",
      icon: "fas fa-user-circle",
    },
    {
      name: "Update Password",
      url: "/me/update_password",
      icon: "fas fa-lock",
    },
  ];

  const [activeMenuItem, setActiveMenuItem] = useState(pathName);

  const handleMenuItemClick = (name: string) => {
    setActiveMenuItem(name);
  };

  return (
    <div className="list-group mt-5 pl-4">
      {menuItem.map((item, index) => (
        <Link
          key={index}
          href={item.url}
          className={`fw-bold list-group-item list-group-item-action ${
            activeMenuItem === item.url ? "active" : ""
          }`}
          onClick={() => handleMenuItemClick(item.url)}
          aria-current={activeMenuItem === item.url ? "true" : "false"}
        >
          <i className={`${item.icon} fa-fw pe-2`}></i>
          {item.name}
        </Link>
      ))}
    </div>
  );
};

export default UserSidebar;
