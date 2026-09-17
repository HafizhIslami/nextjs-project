import cloudinary from "cloudinary";
import { getRequiredEnv } from "../config/env";

const getCloudinary = () => {
  cloudinary.v2.config({
    cloud_name: getRequiredEnv("CLOUDINARY_CLOUD_NAME"),
    api_key: getRequiredEnv("CLOUDINARY_API_KEY"),
    api_secret: getRequiredEnv("CLOUDINARY_API_SECRET"),
  });

  return cloudinary.v2;
};

const upload_file = (
  file: string,
  folder: string
): Promise<{ public_id: string; url: string }> => {
  return new Promise((resolve, reject) => {
    getCloudinary().uploader.upload(
      file,
      { resource_type: "auto", folder },
      (error, result) => {
        if (error || !result?.public_id || !result.secure_url) {
          reject(error instanceof Error ? error : new Error("Image upload failed"));
          return;
        }
        resolve({ public_id: result.public_id, url: result.secure_url });
      }
    );
  });
};

const delete_file = async (file: string): Promise<boolean> => {
  const res = await getCloudinary().uploader.destroy(file);

  if (res?.result === "ok") return true;
  return false;
};


export { upload_file, delete_file, cloudinary };
