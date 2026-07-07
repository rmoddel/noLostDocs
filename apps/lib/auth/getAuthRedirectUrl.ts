import { brand } from "@/constants/brand";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);

function normalizeBaseUrl(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function parseUrl(value: string) {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function getConfiguredSiteUrl() {
  const rawValue = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!rawValue) {
    return null;
  }

  const parsed = parseUrl(rawValue);
  if (!parsed) {
    return null;
  }

  return normalizeBaseUrl(parsed.toString());
}

function getBrowserOrigin() {
  if (typeof window === "undefined") {
    return null;
  }

  return normalizeBaseUrl(window.location.origin);
}

export function getPublicAppUrl() {
  const configuredSiteUrl = getConfiguredSiteUrl();
  const browserOrigin = getBrowserOrigin();

  if (configuredSiteUrl) {
    return configuredSiteUrl;
  }

  if (browserOrigin) {
    return browserOrigin;
  }

  return brand.siteUrl;
}

export function buildAuthCallbackUrl(nextPath: string) {
  const safeNextPath = nextPath.startsWith("/") ? nextPath : "/dashboard";
  const baseUrl = getPublicAppUrl();
  const callbackUrl = new URL("/auth/callback", `${baseUrl}/`);
  callbackUrl.searchParams.set("next", safeNextPath);
  return callbackUrl.toString();
}

export function isLocalAuthOrigin(url: string) {
  const parsed = parseUrl(url);
  return parsed ? LOCAL_HOSTS.has(parsed.hostname) : false;
}
