"use client";

import { useUpdatePasswordMutation } from "@/redux/api/userApi";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import ButtonLoader from "../layout/ButtonLoader";

const UpdatePassword = () => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const [updatePassword, { isLoading, isSuccess, error }] =
    useUpdatePasswordMutation();

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  useEffect(() => {
    if (error && "data" in error) {
      toast.error((error.data as { errMessage: string })?.errMessage);
    }

    if (isSuccess) {
      toast.success("Password updated successfully");
      router.refresh();
    }
  }, [error, isSuccess, router]);

  const submitHandler = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    const passwords = { oldPassword, newPassword };

    updatePassword(passwords);
  };
  return (
    <div className="row wrapper">
      <div className="col-10 col-lg-8">
        <form className="shadow rounded bg-body" onSubmit={submitHandler}>
          <h2 className="mb-4">Change Password</h2>

          <div className="mb-3 password-field">
            <label className="form-label" htmlFor="old_password_field">
              Old Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              id="old_password_field"
              className="form-control"
              name="oldPassword"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="password-toggle"
              aria-pressed={showPassword}
              aria-label={showPassword ? "Hide old password" : "Show old password"}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <div className="mb-3">
            <label className="form-label" htmlFor="new_password_field">
              New Password
            </label>
            <input
              type="password"
              id="new_password_field"
              className="form-control"
              name="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label" htmlFor="confirm_new_password_field">
              Confirm New Password
            </label>
            <input
              type="password"
              id="confirm_new_password_field"
              className={`form-control ${
                newPassword !== confirmPassword ? "is-invalid" : ""
              }`}
              name="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              minLength={6}
              aria-describedby="confirm_password_feedback"
              required
            />
            <div className="invalid-feedback" id="confirm_password_feedback">
              Please rewrite your new password correctly.
            </div>
          </div>

          <button
            type="submit"
            className="btn form-btn w-100 py-2"
            disabled={isLoading}
          >
            {isLoading ? <ButtonLoader /> : "Set Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UpdatePassword;
