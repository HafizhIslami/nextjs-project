"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import React, { useState } from "react";
import toast from "react-hot-toast";
import ButtonLoader from "../layout/ButtonLoader";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const router = useRouter();
  const submitHandler = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);
    if (result?.error) {
      toast.error(result.error);
    } else {
      router.replace("/");
    }
  };

  return (
    <>
      <div className="row wrapper">
        <div className="col-10 col-lg-5">
          <form className="shadow rounded bg-body" onSubmit={submitHandler}>
            <h1 className="mb-3">Login</h1>
            <div className="mb-3">
              <label className="form-label" htmlFor="email_field">
                {" "}
                Email{" "}
              </label>
              <input
                type="email"
                id="email_field"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="mb-3 password-field">
              <label className="form-label" htmlFor="password_field">
                Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                id="password_field"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="password-toggle"
                aria-pressed={showPassword}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <Link href="/password/forgot" className="float-end mt-2">
              Forgot Password?
            </Link>

            <button
              id="login_button"
              type="submit"
              className="btn form-btn w-100 py-2"
              disabled={loading}
            >
              {loading ? <ButtonLoader /> : "LOGIN"}
            </button>

            <div className="mt-3 mb-4">
              <Link href="/register" className="float-end">
                New user? Create an account
              </Link>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default Login;
