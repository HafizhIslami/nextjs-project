import Home from "@/components/Home";
import ErrorPage from "./error";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "HomePage - Roomi",
};

type SearchParams = Record<string, string | string[] | undefined>;

const getBaseUrl = () => {
  const requestHeaders = headers();
  const host = requestHeaders.get("host");

  if (process.env.NODE_ENV === "development" && host) {
    const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
    return `${protocol}://${host}`;
  }

  return process.env.API_URL;
};

const getRooms = async (searchParams: SearchParams = {}) => {
  const urlParams = new URLSearchParams();

  Object.entries(searchParams).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => urlParams.append(key, item));
    } else if (value) {
      urlParams.set(key, value);
    }
  });

  const queryString = urlParams.toString();

  try {
    const baseUrl = getBaseUrl();

    if (!baseUrl) {
      throw new Error("API_URL is not configured.");
    }

    const res = await fetch(`${baseUrl}/api/rooms?${queryString}`, {
      cache: "no-cache",
    });

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      throw new Error(`Expected JSON from /api/rooms, received ${contentType}`);
    }

    return await res.json();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, errMessage: message };
  }
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const data = await getRooms(searchParams);

  if (data?.errMessage) {
    return <ErrorPage error={data} />;
  }

  return <Home data={data} />;
}
