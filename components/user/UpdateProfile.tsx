"use client";

import {
  useLazyUpdateSessionQuery,
  useUpdateProfileMutation,
} from "@/redux/api/userApi";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import ButtonLoader from "../layout/ButtonLoader";
import { setUser } from "@/redux/features/userSlice";
import { CustomError } from "@/interfaces/customError";

const UpdateProfile = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const router = useRouter();

  const { user: currentUser } = useAppSelector((state) => state.auth);

  const [updateProfile, { isLoading, isSuccess, error }] =
    useUpdateProfileMutation();

  const [updateSession, { data }] = useLazyUpdateSessionQuery();

  const dispatch = useAppDispatch();

  useEffect(() => {
    if (data) dispatch(setUser(data.user));

    if (currentUser) {
      setName(currentUser?.name);
      setEmail(currentUser?.email);
    }

    if (error && "data" in error) {
      const customError = error.data as CustomError;
      toast.error(customError.errMessage);
    }

    if (isSuccess) {
      toast.success("Profile updated successfully");
      updateSession(undefined);
      router.refresh();
    }
  }, [currentUser, data, dispatch, error, isSuccess, router, updateSession]);

  const submitHandler = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateProfile({ name, email });
  };

  return (
    <div className="row wrapper">
      <div className="col-10 col-lg-8">
        <form className="shadow rounded bg-body" onSubmit={submitHandler}>
          <h2 className="mb-4">Update Profile</h2>

          <div className="mb-3">
            <label htmlFor="name_field" className="form-label">
              Name
            </label>
            <input
              type="text"
              id="name_field"
              className="form-control"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
            />
          </div>

          <div className="mb-3">
            <label htmlFor="email_field" className="form-label">
              Email
            </label>
            <input
              type="email"
              id="email_field"
              className="form-control"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <button
            type="submit"
            className="btn form-btn w-100 py-2"
            disabled={isLoading}
          >
            {isLoading ? <ButtonLoader /> : "Update"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UpdateProfile;
