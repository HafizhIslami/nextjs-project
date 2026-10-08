/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    // Mapbox public tokens are safe to expose; all server secrets stay runtime-only.
    NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN:
      process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || process.env.MAPBOX_ACCESS_TOKEN,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "ik.imagekit.io",
        pathname: "**",
      },
    ],
  },
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
