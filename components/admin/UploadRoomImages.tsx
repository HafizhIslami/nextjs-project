"use client";
import { IImage, IRoom } from "@/backend/models/room";
import {
  useDeleteRoomImageMutation,
  useUploadRoomImagesMutation,
} from "@/redux/api/roomApi";
import { useRouter } from "next/navigation";
import { normalizeImageUrl } from "@/helpers/imageUrl";
import Image from "next/image";
import React, { ChangeEventHandler, useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import ButtonLoader from "../layout/ButtonLoader";

interface Props {
  data: {
    room: IRoom;
  };
}
const UploadRoomImages = ({ data }: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<string[]>([]);
  const [imagesPreview, setImagesPreview] = useState<string[]>([]);
  const [uploadedImages, setUploadedImages] = useState<IImage[]>([]);

  useEffect(() => {
    if (data) {
      setUploadedImages(data?.room?.images);
    }
  }, [data]);

  const router = useRouter();

  const [uploadRoomImages, { error, isLoading, isSuccess }] =
    useUploadRoomImagesMutation();

  const [
    deleteRoomImage,
    {
      error: deleteError,
      isLoading: isDeleteLoading,
      isSuccess: isDeleteSuccess,
    },
  ] = useDeleteRoomImageMutation();

  useEffect(() => {
    if (error && "data" in error) {
      toast.error((error.data as { errMessage: string })?.errMessage);
    }

    if (isSuccess) {
      setImagesPreview([]);
      router.refresh();
      toast.success("Images Uploaded");
    }
  }, [error, isSuccess, router]);

  useEffect(() => {
    if (deleteError && "data" in deleteError) {
      toast.error((deleteError.data as { errMessage: string })?.errMessage);
    }

    if (isDeleteSuccess) {
      router.refresh();
      toast.success("Image Deleted");
    }
  }, [deleteError, isDeleteSuccess, router]);

  const onChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const files = Array.from(e.target.files || []);

    if (
      files.length === 0 ||
      files.length > 10 ||
      files.some(
        (file) => !file.type.startsWith("image/") || file.size > 5 * 1024 * 1024
      )
    ) {
      toast.error("Choose 1-10 images, each no larger than 5 MB");
      e.target.value = "";
      return;
    }

    setImages([]);
    setImagesPreview([]);

    files.forEach((file) => {
      const reader = new FileReader();

      reader.onload = () => {
        if (reader.readyState === 2) {
          setImages((oldArray) => [...oldArray, reader.result as string]);
          setImagesPreview((oldArray) => [
            ...oldArray,
            reader.result as string,
          ]);
        }
      };

      reader.readAsDataURL(file);
    });
  };

  const submitHandler = () => {
    uploadRoomImages({ id: data?.room?._id, body: { images } });
  };

  const formSubmitHandler = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitHandler();
  };

  const removeImagePreview = (imgUrl: string) => {
    const filteredImagesPreview = imagesPreview.filter((img) => img != imgUrl);

    setImagesPreview(filteredImagesPreview);
    setImages(filteredImagesPreview);
  };

  const handleImageDelete = (imgId: string) => {
    deleteRoomImage({ id: data?.room?._id, body: { imgId } });
  };

  const handleResetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="row wrapper">
      <div className="col-10 col-lg-7 mt-5 mt-lg-0">
        <form className="shadow rounded bg-body" onSubmit={formSubmitHandler}>
          <h2 className="mb-4">Upload Room Images</h2>

          <div className="form-group">
            <label htmlFor="customFile" className="form-label">
              Choose Images
            </label>

            <div className="custom-file">
              <input
                ref={fileInputRef}
                type="file"
                name="product_images"
                className="form-control"
                id="customFile"
                onChange={onChange}
                onClick={handleResetFileInput}
                multiple
                required
              />
              <p className="text-danger 10px">* use 16:9 ratio for best display</p>
            </div>

            {imagesPreview?.length > 0 && (
              <div className="new-images mt-4">
                <p className="text-warning">New Images:</p>
                <div className="row mt-4">
                  {imagesPreview?.map((img) => (
                    <div className="col-md-3 mt-2" key={img}>
                      <div className="card">
                        <Image
                          src={img}
                          alt="Img Preview"
                          className="card-img-top image-fluid p-2"
                          width={300}
                          height={80}
                          sizes="(max-width: 768px) 100vw, 25vw"
                          unoptimized
                          style={{ width: "100%", height: "80px", objectFit: "cover" }}
                        />
                        <button
                          style={{
                            backgroundColor: "#dc3545",
                            borderColor: "#dc3545",
                          }}
                          type="button"
                          className="btn btn-block btn-danger cross-button mt-1 py-0"
                          onClick={() => removeImagePreview(img)}
                          aria-label="Remove image from upload list"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {uploadedImages?.length > 0 && (
              <div className="uploaded-images mt-4">
                <p className="text-success">Room Uploaded Images:</p>
                <div className="row mt-1">
                  {uploadedImages?.map((img) => (
                    <div className="col-md-3 mt-2" key={img.public_id}>
                      <div className="card">
                        <Image
                          src={normalizeImageUrl(
                            img?.url,
                            "/images/default_room_image.jpg"
                          )}
                          alt="Uploaded room preview"
                          className="card-img-top p-2"
                          width={300}
                          height={80}
                          sizes="(max-width: 768px) 100vw, 25vw"
                          style={{ width: "100%", height: "80px", objectFit: "cover" }}
                        />
                        <button
                          style={{
                            backgroundColor: "#dc3545",
                            borderColor: "#dc3545",
                          }}
                          className="btn btn-block btn-danger cross-button mt-1 py-0"
                          onClick={() => handleImageDelete(img.public_id)}
                          disabled={isDeleteLoading || isLoading}
                          aria-label="Delete uploaded room image"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            id="register_button"
            type="submit"
            className="btn form-btn w-100 py-2"
            disabled={isLoading || isDeleteLoading}
          >
            {isLoading ? <ButtonLoader /> : "Upload"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadRoomImages;
