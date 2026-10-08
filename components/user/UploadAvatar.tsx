"use client";

import {
  useLazyUpdateSessionQuery,
  useUploadAvatarMutation,
} from "@/redux/api/userApi";
import { setUser } from "@/redux/features/userSlice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { normalizeImageUrl } from "@/helpers/imageUrl";
import { useRouter } from "next/navigation";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import ButtonLoader from "../layout/ButtonLoader";

const UploadAvatar = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const [uploadAvatar, { isLoading, error, isSuccess }] =
    useUploadAvatarMutation();

  const [avatar, setAvatar] = useState("");
  const [avatarPreview, setAvatarPreview] = useState(
    "/images/default_avatar.jpg"
  );

  const { user } = useAppSelector((state) => state.auth);

  const [updateSession, { data }] = useLazyUpdateSessionQuery();

  useEffect(() => {
    if (data) dispatch(setUser(data.user));

    if (user?.avatar?.url) {
      setAvatarPreview(
        normalizeImageUrl(user.avatar.url, "/images/default_avatar.jpg")
      );
    }

    if (error && "data" in error) {
      toast.error((error.data as { errMessage: string })?.errMessage);
    }

    if (isSuccess) {
      toast.success("Profile updated successfully");
      updateSession(undefined);
      router.refresh();
    }
  }, [data, dispatch, error, isSuccess, router, updateSession, user]);

  const submitHandler = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const userData = { avatar };
    uploadAvatar(userData);
  };

  const changeHandler: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const files = Array.from(e.target.files || []);
    const file = files[0];

    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      toast.error("Choose an image no larger than 5 MB");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (reader.readyState === 2) {
        setAvatar(reader.result as string);
        setAvatarPreview(reader.result as string);
      }
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className="row wrapper">
      <div className="col-10 col-lg-8">
        <form className="shadow rounded bg-body" onSubmit={submitHandler}>
          <h2 className="mb-4">Upload Avatar</h2>

          <div className="form-group">
            <div className="d-flex align-items-center">
              <div className="me-3">
                <figure className="avatar item-rtl">
                  <Image
                    src={avatarPreview}
                    className="rounded-circle"
                    alt="image"
                    width={100}
                    height={100}
                    sizes="100px"
                    unoptimized
                  />
                </figure>
              </div>
              <div className="input-foam">
                <label className="form-label" htmlFor="customFile">
                  Choose Avatar
                </label>
                <input
                  type="file"
                  name="avatar"
                  className="form-control"
                  id="customFile"
                  accept="image/*"
                  onChange={changeHandler}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="btn form-btn w-100 py-2"
            disabled={isLoading}
          >
            {isLoading ? <ButtonLoader /> : "Upload"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadAvatar;
