import { normalizeHostname } from "../tenancy/hostname";

const urlHostname = (value: string | undefined): string | null => {
  if (!value) return null;
  try {
    return normalizeHostname(new URL(value).hostname);
  } catch {
    return null;
  }
};

export const getPlatformHostnames = (): string[] => {
  const configured = [
    normalizeHostname(process.env.PLATFORM_ROOT_DOMAIN),
    urlHostname(process.env.PLATFORM_CONSOLE_URL),
    urlHostname(process.env.API_URL),
    urlHostname(process.env.NEXTAUTH_URL),
  ].filter((value): value is string => Boolean(value));

  if (process.env.NODE_ENV !== "production") {
    configured.push("localhost", "127.0.0.1");
  }

  return Array.from(new Set(configured));
};

export const isPlatformHostname = (rawHostname: string | null | undefined) =>
  getPlatformHostnames().includes(normalizeHostname(rawHostname));

