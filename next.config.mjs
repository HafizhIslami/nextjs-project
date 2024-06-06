/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    API_URL: "http://localhost:3000",
    DB_LOCAL_URI: "mongodb://localhost:27017/nextjs-project",
    DB_URI: "",

    CLOUDINARY_CLOUD_NAME: "dcujacenq",
    CLOUDINARY_API_KEY: "453715877975519",
    CLOUDINARY_API_SECRET: "xmjzyaZeuCpiOJqIp3aXMLZLfrk",

    NEXTAUTH_URL: "http://localhost:3000",
    NEXTAUTH_SECRET: "this_is_auth_secret",

    SMTP_HOST: "sandbox.smtp.mailtrap.io",
    SMTP_PORT: "2525",
    SMTP_USER: "fb544ad2f13e4e",
    SMTP_PASSWORD: "a9f8c6ebca2a68",
    SMTP_FROM_EMAIL: "noreply@myapp.com",
    SMTP_FROM_NAME: "MyApp",

    GEOCODER_PROVIDER:"google",
    GEOCODER_API_KEY:""
  },
  images: {
    domains: ["res.cloudinary.com"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "**",
      },
    ],
  },
};

export default nextConfig;
