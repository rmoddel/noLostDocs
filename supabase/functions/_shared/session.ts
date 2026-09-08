import { corsHeaders } from "./cors.ts";

type JwtPayload = {
  auth_time?: number;
  iat?: number;
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
  const issuedAt = payload?.auth_time ?? payload?.iat;
  const nowSeconds = Math.floor(Date.now() / 1000);

  if (!issuedAt || nowSeconds - issuedAt > maxAgeSeconds) {
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
