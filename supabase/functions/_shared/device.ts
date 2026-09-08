import type { SupabaseClient } from "npm:@supabase/supabase-js@2.108.2";
import { corsHeaders } from "./cors.ts";

type DevicePayload = {
  deviceFingerprint?: unknown;
  deviceId?: unknown;
  platform?: unknown;
};

type DeviceRow = {
  device_name: string | null;
  id: string;
  is_locked: boolean;
  is_trusted: boolean;
  platform: string;
};

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function fail(functionName: string, message: string, status = 403): never {
  throw Response.json(
    {
      ok: false,
      function: functionName,
      message
    },
    { status, headers: corsHeaders }
  );
}

export function readDeviceContext(request: Request, payload: DevicePayload = {}) {
  return {
    deviceFingerprint:
      optionalString(payload.deviceFingerprint) ?? optionalString(request.headers.get("x-nolostdocs-device-fingerprint")),
    deviceId: optionalString(payload.deviceId) ?? optionalString(request.headers.get("x-nolostdocs-device-id")),
    platform: optionalString(payload.platform) ?? "web"
  };
}

export async function requireTrustedDevice(
  admin: SupabaseClient,
  userId: string,
  request: Request,
  payload: DevicePayload,
  functionName: string
) {
  const context = readDeviceContext(request, payload);

  if (!context.deviceId && !context.deviceFingerprint) {
    fail(functionName, "Register this browser before requesting protected file access.");
  }

  let query = admin
    .from("devices")
    .select("id, device_name, platform, is_trusted, is_locked")
    .eq("user_id", userId)
    .order("last_seen_at", { ascending: false })
    .limit(1);

  query = context.deviceId
    ? query.eq("id", context.deviceId)
    : query.eq("platform", context.platform).eq("device_fingerprint", context.deviceFingerprint);

  const { data, error } = await query.maybeSingle<DeviceRow>();

  if (error) {
    throw error;
  }

  if (!data) {
    fail(functionName, "This browser is not registered for protected file access.");
  }

  if (!data.is_trusted) {
    fail(functionName, "This browser is not trusted for protected file access.");
  }

  if (data.is_locked) {
    fail(functionName, "This browser is locked. Restore access before requesting protected files.", 423);
  }

  await admin
    .from("devices")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", data.id)
    .eq("user_id", userId);

  return data;
}
