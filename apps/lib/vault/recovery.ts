import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { CLIENT_ENCRYPTION_VERSION, LEGACY_ENCRYPTION_VERSION, readStoredWrappingKey, type ClientEncryptionMetadata } from "@/lib/documents/encryption";
import { decode64, encode64, unlockRecoveryEnvelope, type createRecoveryEnvelope } from "./crypto";
import { storeVaultKey } from "./store";
export type PendingRecovery = Awaited<ReturnType<typeof createRecoveryEnvelope>>;
export async function activateRecovery(userId: string, pending: PendingRecovery, confirmation: string) {
  // Confirm the saved code can actually decrypt before committing anything remotely.
  const verifiedKey = await unlockRecoveryEnvelope(userId, pending.envelope, confirmation);
  const { client } = createBrowserSupabaseClient();
  const files: { id: string; encrypted_file_key: ClientEncryptionMetadata }[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await client.from("document_files").select("id, encrypted_file_key").eq("user_id", userId).eq("encryption_version", LEGACY_ENCRYPTION_VERSION).order("id").range(offset, offset + 499);
    if (error) throw new Error("Cannot load older document keys. Nothing has been changed.");
    files.push(...(data ?? []) as typeof files);
    if (!data || data.length < 500) break;
  }
  const updates = [];
  for (const file of files) {
    const metadata = file.encrypted_file_key;
    const old = metadata?.wrapping_key_id ? await readStoredWrappingKey(metadata.wrapping_key_id) : null;
    if (!old?.key) throw new Error("An older document needs a key from its original browser. Open recovery setup there. No files have been changed.");
    const fileKey = await crypto.subtle.unwrapKey("raw", decode64(metadata.wrapped_file_key), old.key, { name: "AES-GCM", iv: decode64(metadata.wrapping_key_iv) }, { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const wrapped = await crypto.subtle.wrapKey("raw", fileKey, verifiedKey, { name: "AES-GCM", iv });
    updates.push({ id: file.id, metadata: { ...metadata, scheme: CLIENT_ENCRYPTION_VERSION, wrapping_key_scope: "recovery-code", wrapping_key_id: pending.envelope.vault_key_id, wrapping_key_iv: encode64(iv), wrapped_file_key: encode64(new Uint8Array(wrapped)) } });
  }
  const { error } = await client.rpc("initialize_vault_recovery", {
    p_user_id: userId,
    p_vault_key_id: pending.envelope.vault_key_id,
    p_encrypted_vault_key: pending.envelope.encrypted_vault_key,
    p_recovery_iv: pending.envelope.recovery_iv,
    p_files: updates
  });
  if (error) throw new Error("Recovery setup was not completed. Another browser may have changed your documents; refresh and try again. Keep the recovery code you saved.");
  await storeVaultKey(userId, pending.envelope.vault_key_id, verifiedKey);
  return updates.length;
}
