import type { SupabaseClient } from "npm:@supabase/supabase-js@2.108.2";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type AuditEventInput = {
  action: string;
  deviceId?: string | null;
  metadata?: Record<string, unknown>;
  request?: Request;
  resourceId?: string | null;
  resourceType?: string | null;
  userId: string;
};

function firstHeaderValue(value: string | null) {
  return value?.split(",")[0]?.trim() || null;
}

function getRequestIp(request?: Request) {
  if (!request) {
    return null;
  }

  return (
    firstHeaderValue(request.headers.get("cf-connecting-ip")) ??
    firstHeaderValue(request.headers.get("x-forwarded-for")) ??
    firstHeaderValue(request.headers.get("x-real-ip"))
  );
}

function normalizeUuid(value?: string | null) {
  return value && UUID_PATTERN.test(value) ? value : null;
}

export async function recordAuditEvent(admin: SupabaseClient, input: AuditEventInput) {
  const normalizedResourceId = normalizeUuid(input.resourceId);
  const metadata = {
    ...(input.metadata ?? {}),
    ...(input.resourceId && !normalizedResourceId ? { resource_id_raw: input.resourceId } : {})
  };

  const { error } = await admin.from("audit_events").insert({
    user_id: input.userId,
    device_id: normalizeUuid(input.deviceId),
    action: input.action,
    resource_type: input.resourceType ?? null,
    resource_id: normalizedResourceId,
    ip_address: getRequestIp(input.request),
    user_agent: input.request?.headers.get("user-agent") ?? null,
    metadata
  });

  if (error) {
    throw error;
  }
}
