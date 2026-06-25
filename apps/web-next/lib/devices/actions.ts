import { prototypeSnapshot } from "@doc-wallet/config";
import type { DeviceRecord } from "@doc-wallet/types";
import type { Session, SupabaseClient } from "@supabase/supabase-js";

export type DeviceActionState = {
  loading: boolean;
  message: string | null;
};

export function normalizeDeviceRow(row: Record<string, unknown>): DeviceRecord {
  return {
    id: String(row.id),
    name: String(row.device_name ?? "Unknown device"),
    platform: String(row.platform ?? "web") as DeviceRecord["platform"],
    trusted: Boolean(row.is_trusted),
    locked: Boolean(row.is_locked),
    lastSeen: row.last_seen_at ? new Date(String(row.last_seen_at)).toLocaleString() : "never"
  };
}

export function getBrowserFingerprint() {
  if (typeof navigator === "undefined") {
    return "web-server-render";
  }

  return `${navigator.platform}:${navigator.userAgent}`.slice(0, 180);
}

export async function loadDevices(client: SupabaseClient, configured: boolean, session: Session | null) {
  if (!configured || !session) {
    return { devices: prototypeSnapshot.devices, message: null };
  }

  const { data, error } = await client
    .from("devices")
    .select("id, device_name, platform, is_trusted, is_locked, last_seen_at")
    .order("last_seen_at", { ascending: false });

  if (error) {
    return { devices: prototypeSnapshot.devices, message: error.message };
  }

  return {
    devices: (data ?? []).map((row) => normalizeDeviceRow(row as Record<string, unknown>)),
    message: null
  };
}

export async function registerBrowser(client: SupabaseClient, configured: boolean, session: Session | null) {
  if (!configured || !session) {
    return { message: "Device setup isn't connected yet." };
  }

  const { error } = await client.functions.invoke("register-device", {
    body: {
      deviceName: "Current Browser",
      platform: "web",
      deviceFingerprint: getBrowserFingerprint()
    }
  });

  if (error) {
    return { message: error.message };
  }

  return { message: "Browser registered or refreshed." };
}

export async function setDeviceLocked(
  client: SupabaseClient,
  configured: boolean,
  session: Session | null,
  deviceId: string,
  shouldLock: boolean
) {
  if (!configured || !session) {
    return {
      message: shouldLock ? "Demo device locked." : "Demo device unlocked."
    };
  }

  const fn = shouldLock ? "lock-device" : "unlock-device";
  const { error } = await client.functions.invoke(fn, {
    body: { deviceId }
  });

  if (error) {
    return { message: error.message };
  }

  return {
    message: shouldLock ? "Device marked lost and locked." : "Device unlocked and re-authorized."
  };
}
