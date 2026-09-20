import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { RecoveryEnvelope } from "./crypto";
export type LocalVaultKey = { id: string; userId: string; key: CryptoKey };
function database() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("nolostdocs-recovery-keys", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("keys", { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error("Cannot open this browser's secure key storage."));
  });
}
export async function storeVaultKey(userId: string, keyId: string, key: CryptoKey) {
  if (key.extractable) throw new Error("Vault keys must be stored as non-extractable keys.");
  const db = await database();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction("keys", "readwrite");
    tx.objectStore("keys").put({ id: `${userId}:${keyId}`, userId, key });
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onabort = tx.onerror = () => { db.close(); reject(new Error("Cannot save the vault key in this browser. Keep your recovery code and try unlocking again.")); };
  });
}
export async function readVaultKey(userId: string, keyId: string): Promise<CryptoKey | null> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("keys", "readonly");
    const request = tx.objectStore("keys").get(`${userId}:${keyId}`);
    request.onsuccess = () => resolve(request.result?.userId === userId ? request.result.key : null);
    request.onerror = () => reject(new Error("Cannot read this browser's vault key."));
    tx.oncomplete = () => db.close();
  });
}
export async function getRecoveryEnvelope(userId: string): Promise<RecoveryEnvelope | null> {
  const { client } = createBrowserSupabaseClient();
  const { data, error } = await client.from("vault_recovery").select("vault_key_id, encrypted_vault_key, recovery_iv, scheme").eq("user_id", userId).maybeSingle();
  if (error) throw new Error("Recovery settings could not be loaded. Please try again.");
  return data as RecoveryEnvelope | null;
}
export async function requireVaultKey(userId: string) {
  const envelope = await getRecoveryEnvelope(userId);
  if (!envelope) throw new Error("Set up your recovery code on the Recovery page before uploading documents.");
  const key = await readVaultKey(userId, envelope.vault_key_id);
  if (!key) throw new Error("Unlock this browser with your saved code on the Recovery page before opening or saving documents.");
  return { id: envelope.vault_key_id, key };
}
