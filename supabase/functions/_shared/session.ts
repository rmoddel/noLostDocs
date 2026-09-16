import { corsHeaders } from "./cors.ts";

type JwtPayload = {
  auth_time?: number;
  amr?: { method?: string; timestamp?: number }[];
};

function base64UrlDecode(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  return atob(padded);
}

function readJwtPayload(token: string): JwtPayload | null {
  const [, payload] = token.split(".");
  if (!payload) {
    return null;
  }

  try {
    return JSON.parse(base64UrlDecode(payload)) as JwtPayload;
  } catch {
    return null;
  }
}

export function requireRecentAuth(token: string, functionName: string, maxAgeSeconds: number) {
  const payload = readJwtPayload(token);
  // Only use authentication events, never JWT issuance (iat changes on refresh).
  const timestamps = (Array.isArray(payload?.amr) ? payload.amr : [])
    .filter((entry) => entry && ["password", "otp", "oauth", "totp", "sso/saml", "sso/oidc", "webauthn"].includes(entry.method ?? ""))
    .map((entry) => entry.timestamp)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  const issuedAt = timestamps.length ? Math.max(...timestamps) : payload?.auth_time;
  const nowSeconds = Math.floor(Date.now() / 1000);

  if (typeof issuedAt !== "number" || !Number.isFinite(issuedAt) || issuedAt > nowSeconds + 30 || nowSeconds - issuedAt > maxAgeSeconds) {
    throw Response.json(
      {
        ok: false,
        function: functionName,
        message: "Sign in again before using this protected action."
      },
      { status: 401, headers: corsHeaders }
    );
  }
}
