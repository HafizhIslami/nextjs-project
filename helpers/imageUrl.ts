const HTTPS_IMAGE_HOSTS = new Set([
  "res.cloudinary.com",
  "ik.imagekit.io",
]);

export const normalizeImageUrl = (
  value: string | null | undefined,
  fallback: string
): string => {
  if (!value) return fallback;

  if (value.startsWith("/") || value.startsWith("data:image/")) {
    return value;
  }

  try {
    const url = new URL(value);
    if (url.protocol === "http:" && HTTPS_IMAGE_HOSTS.has(url.hostname)) {
      url.protocol = "https:";
      return url.toString();
    }
  } catch {
    return fallback;
  }

  return value;
};
