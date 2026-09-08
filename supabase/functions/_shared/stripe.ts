const encoder = new TextEncoder();

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function parseStripeSignatureHeader(header: string) {
  const values = new Map<string, string[]>();

  for (const part of header.split(",")) {
    const [key, value] = part.split("=", 2);
    if (!key || !value) {
      continue;
    }

    const existing = values.get(key) ?? [];
    existing.push(value);
    values.set(key, existing);
  }

  return values;
}

function timingSafeEqualHex(left: string, right: string) {
  const maxLength = Math.max(left.length, right.length);
  let mismatch = left.length === right.length ? 0 : 1;

  for (let index = 0; index < maxLength; index += 1) {
    mismatch |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  }

  return mismatch === 0;
}

async function hmacSha256Hex(secret: string, payload: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return bytesToHex(new Uint8Array(signature));
}

export async function assertStripeWebhookSignature(rawBody: string, signatureHeader: string | null, secret: string) {
  if (!signatureHeader) {
    throw new Error("Missing Stripe-Signature header.");
  }

  const parsed = parseStripeSignatureHeader(signatureHeader);
  const timestamp = parsed.get("t")?.[0];
  const signatures = parsed.get("v1") ?? [];
  const timestampSeconds = timestamp ? Number(timestamp) : Number.NaN;

  if (!timestamp || !Number.isFinite(timestampSeconds) || !signatures.length) {
    throw new Error("Invalid Stripe-Signature header.");
  }

  const toleranceSeconds = Number(Deno.env.get("STRIPE_WEBHOOK_TOLERANCE_SECONDS") ?? "300");
  const nowSeconds = Math.floor(Date.now() / 1000);

  if (Math.abs(nowSeconds - timestampSeconds) > toleranceSeconds) {
    throw new Error("Stripe webhook signature timestamp is outside the accepted tolerance.");
  }

  const expectedSignature = await hmacSha256Hex(secret, `${timestamp}.${rawBody}`);
  const matched = signatures.some((signature) => timingSafeEqualHex(signature, expectedSignature));

  if (!matched) {
    throw new Error("Stripe webhook signature verification failed.");
  }
}
