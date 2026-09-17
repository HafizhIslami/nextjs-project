"use client";

import { setIsAuthenticated, setUser } from "@/redux/features/userSlice";
import type { AuthUser } from "@/redux/features/userSlice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { normalizeImageUrl } from "@/helpers/imageUrl";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect } from "react";
import roomiLogo from "../../public/images/roomi_header_small.png";

const Header = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { data, status } = useSession();

  useEffect(() => {
    if (data) {
      dispatch(setUser(data.user as AuthUser));
      dispatch(setIsAuthenticated(true));
    } else if (status === "unauthenticated") {
      dispatch(setUser(null));
      dispatch(setIsAuthenticated(false));
    }
  }, [data, dispatch, status]);

  const logoutHandler = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <header className="site-header sticky-top">
      <nav className="container header-nav" aria-label="Primary navigation">
        <Link href="/" className="brand-link" aria-label="Roomi home">
          <Image
            src={roomiLogo}
            alt="Roomi"
            width={190}
            priority
            className="brand-logo"
          />
        </Link>

        <div className="header-actions">
          <Link href="/search" className="header-browse-link">
            Browse stays
          </Link>

          {status === "loading" ? (
            <div className="account-skeleton" aria-label="Loading account" />
          ) : user ? (
            <details className="account-menu">
              <summary>
                <Image
                  src={normalizeImageUrl(
                    user.avatar?.url,
                    "/images/default_avatar.jpg"
                  )}
                  alt=""
                  className="rounded-circle"
                  height={40}
                  width={40}
                  sizes="40px"
                />
                <span className="account-name">
                  {user.name.replace(/\b(\w)/g, (letter: string) =>
                    letter.toUpperCase()
                  )}
                </span>
              </summary>
              <div className="account-panel">
                {user.role === "admin" && (
                  <Link href="/admin/dashboard">Admin dashboard</Link>
                )}
                <Link href="/bookings/me">My bookings</Link>
                <Link href="/me/update">Account settings</Link>
                <button type="button" onClick={logoutHandler}>
                  Log out
                </button>
              </div>
            </details>
          ) : (
            <div className="auth-actions">
              <Link href="/register" className="btn btn-ghost auth-register">
                Sign up
              </Link>
              <Link href="/login" className="btn btn-primary-roomi">
                Log in
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;
