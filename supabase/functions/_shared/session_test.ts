import { requireRecentAuth } from "./session.ts";

const now = Math.floor(Date.now() / 1000);
function token(payload: unknown) { return `header.${btoa(JSON.stringify(payload))}.signature`; }
function rejects(payload: unknown) {
  try { requireRecentAuth(token(payload), "test", 600); }
  catch (error) { if (error instanceof Response && error.status === 401) return; throw error; }
  throw new Error("Expected stale or invalid authentication to be rejected");
}
Deno.test("recent password authentication is accepted", () => {
  requireRecentAuth(token({ amr: [{ method: "password", timestamp: now - 30 }] }), "test", 600);
});
Deno.test("token refresh cannot extend recent authentication", () => {
  rejects({ iat: now, amr: [{ method: "password", timestamp: now - 3600 }] });
  rejects({ iat: now });
  rejects({ amr: [{ method: "token_refresh", timestamp: now }] });
});
Deno.test("malformed and future authentication timestamps fail closed", () => {
  rejects({ amr: [{ method: "password", timestamp: "yesterday" }] });
  rejects({ amr: [{ method: "password", timestamp: now + 600 }] });
  rejects({ amr: {} });
  rejects({});
});
Deno.test("recent MFA authentication is accepted", () => {
  requireRecentAuth(token({ amr: [{ method: "password", timestamp: now - 3600 }, { method: "totp", timestamp: now - 10 }] }), "test", 600);
});
