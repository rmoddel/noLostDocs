export const RECOVERY_SCHEME = "nld-recovery-aes-gcm-v1";
export type RecoveryEnvelope = { vault_key_id: string; encrypted_vault_key: string; recovery_iv: string; scheme: string };
const encoder = new TextEncoder();
export function encode64(bytes: Uint8Array) { return btoa(String.fromCharCode(...bytes)); }
export function decode64(value: string) { return Uint8Array.from(atob(value), (char) => char.charCodeAt(0)); }
function binding(userId: string, keyId: string) { return encoder.encode(JSON.stringify([RECOVERY_SCHEME, userId, keyId])); }
export function normalizeRecoveryCode(value: string) {
  const normalized = value.toUpperCase().replace(/[\s-]/g, "");
  if (!/^NLD1[0-9A-F]{64}$/.test(normalized)) throw new Error("Enter the complete recovery code beginning with NLD1.");
  return normalized.slice(4);
}
async function recoveryKey(code: string) {
  const hex = normalizeRecoveryCode(code);
  const raw = Uint8Array.from(hex.match(/../g)!, (part) => parseInt(part, 16));
  try { return await crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]); }
  finally { raw.fill(0); }
}
export async function createRecoveryEnvelope(userId: string) {
  const rawCode = crypto.getRandomValues(new Uint8Array(32));
  const hex = Array.from(rawCode, (value) => value.toString(16).padStart(2, "0")).join("").toUpperCase();
  rawCode.fill(0);
  const code = "NLD1-" + hex.match(/.{8}/g)!.join("-");
  const id = crypto.randomUUID();
  const rawKey = crypto.getRandomValues(new Uint8Array(32));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  try {
    const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: binding(userId, id) }, await recoveryKey(code), rawKey);
    const key = await crypto.subtle.importKey("raw", rawKey, "AES-GCM", false, ["wrapKey", "unwrapKey"]);
    const envelope: RecoveryEnvelope = { vault_key_id: id, encrypted_vault_key: encode64(new Uint8Array(encrypted)), recovery_iv: encode64(iv), scheme: RECOVERY_SCHEME };
    return { code, key, envelope };
  } finally { rawKey.fill(0); }
}
export async function unlockRecoveryEnvelope(userId: string, envelope: RecoveryEnvelope, code: string) {
  if (envelope.scheme !== RECOVERY_SCHEME) throw new Error("Unsupported recovery format.");
  const ciphertext = decode64(envelope.encrypted_vault_key), iv = decode64(envelope.recovery_iv);
  if (ciphertext.length !== 48 || iv.length !== 12) throw new Error("Invalid recovery data.");
  let raw: Uint8Array<ArrayBuffer>;
  try {
    raw = new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv, additionalData: binding(userId, envelope.vault_key_id) }, await recoveryKey(code), ciphertext));
  } catch { throw new Error("This recovery code does not unlock this account. Check the saved code and try again."); }
  try { return await crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["wrapKey", "unwrapKey"]); }
  finally { raw.fill(0); }
}
