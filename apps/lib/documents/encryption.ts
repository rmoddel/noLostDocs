import { readVaultKey, requireVaultKey } from "@/lib/vault/store";
import type { DocumentTemplate } from "@nolostdocs/types";

export const LEGACY_ENCRYPTION_VERSION = "client-webcrypto-aes-gcm-local-device-v1";
export const CLIENT_ENCRYPTION_VERSION = "client-webcrypto-aes-gcm-recovery-v2";

const DB_NAME = "nolostdocs-vault-keys";
const DB_VERSION = 1;
const STORE_NAME = "wrappingKeys";
const encoder = new TextEncoder();

type StoredWrappingKey = {
  createdAt: string;
  id: string;
  key: CryptoKey;
};

export type ClientEncryptionMetadata = {
  file_iv: string;
  original_name: string;
  original_size: number;
  original_type: string;
  scheme: typeof CLIENT_ENCRYPTION_VERSION | typeof LEGACY_ENCRYPTION_VERSION;
  wrapped_file_key: string;
  wrapping_key_id: string;
  wrapping_key_scope: "local-device" | "recovery-code";
  wrapping_key_iv: string;
};

export type EncryptedFilePayload = {
  encryptionMetadata: ClientEncryptionMetadata;
  encryptionVersion: typeof CLIENT_ENCRYPTION_VERSION;
  file: File;
};

function requireBrowserCrypto() {
  if (typeof window === "undefined" || !window.crypto?.subtle || !window.indexedDB) {
    throw new Error("Encrypted upload requires a secure browser with Web Crypto and IndexedDB.");
  }
}

function randomIv() {
  const iv = new Uint8Array(12);
  window.crypto.getRandomValues(iv);
  return iv;
}

function bytesToBase64(bytes: Uint8Array) {
  let value = "";
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    value += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }

  return btoa(value);
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  return bytesToBase64(new Uint8Array(buffer));
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function openKeyDatabase() {
  requireBrowserCrypto();

  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onerror = () => reject(request.error ?? new Error("Unable to open the local vault key store."));
    request.onsuccess = () => resolve(request.result);
  });
}

export async function readStoredWrappingKey(id: string) {
  const database = await openKeyDatabase();

  return new Promise<StoredWrappingKey | null>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).get(id);

    request.onerror = () => reject(request.error ?? new Error("Unable to read the local vault key."));
    request.onsuccess = () => resolve((request.result as StoredWrappingKey | undefined) ?? null);
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => {
      database.close();
      reject(transaction.error ?? new Error("Unable to read the local vault key."));
    };
  });
}

function encryptedFileName(fileName: string) {
  return `${fileName.replace(/\s+/g, "-")}.nld.enc`;
}

export function getEncryptionMetadata(template: DocumentTemplate) {
  return template.encryptedFileKey as ClientEncryptionMetadata | undefined;
}

export function isLocallyEncryptedDocument(template: DocumentTemplate) {
  return [CLIENT_ENCRYPTION_VERSION, LEGACY_ENCRYPTION_VERSION].includes(template.encryptionVersion ?? "") && Boolean(getEncryptionMetadata(template));
}

export async function encryptFileForLocalDevice(file: File, userId: string): Promise<EncryptedFilePayload> {
  requireBrowserCrypto();

  const wrappingKey = await requireVaultKey(userId);
  const fileKey = await window.crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, [
    "encrypt",
    "decrypt"
  ]);
  const fileIv = randomIv();
  const wrappingKeyIv = randomIv();
  const fileBytes = await file.arrayBuffer();
  const encryptedBytes = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv: fileIv }, fileKey, fileBytes);
  const wrappedFileKey = await window.crypto.subtle.wrapKey(
    "raw",
    fileKey,
    wrappingKey.key,
    { name: "AES-GCM", iv: wrappingKeyIv }
  );
  const metadata: ClientEncryptionMetadata = {
    file_iv: bytesToBase64(fileIv),
    original_name: file.name,
    original_size: file.size,
    original_type: file.type || "application/octet-stream",
    scheme: CLIENT_ENCRYPTION_VERSION,
    wrapped_file_key: arrayBufferToBase64(wrappedFileKey),
    wrapping_key_id: wrappingKey.id,
    wrapping_key_scope: "recovery-code",
    wrapping_key_iv: bytesToBase64(wrappingKeyIv)
  };

  return {
    encryptionMetadata: metadata,
    encryptionVersion: CLIENT_ENCRYPTION_VERSION,
    file: new File([encryptedBytes], encryptedFileName(file.name), {
      lastModified: Date.now(),
      type: "application/octet-stream"
    })
  };
}

export async function decryptFileFromLocalDevice(encryptedBlob: Blob, metadata: ClientEncryptionMetadata, userId: string) {
  requireBrowserCrypto();

  const wrappingKey = metadata.scheme === CLIENT_ENCRYPTION_VERSION
    ? await readVaultKey(userId, metadata.wrapping_key_id)
    : (await readStoredWrappingKey(metadata.wrapping_key_id))?.key;
  if (!wrappingKey) {
    throw new Error(metadata.scheme === CLIENT_ENCRYPTION_VERSION
      ? "Unlock this browser with your saved code on the Recovery page."
      : "Open this older file in its original browser and set up recovery there first.");
  }

  const fileKey = await window.crypto.subtle.unwrapKey(
    "raw",
    base64ToBytes(metadata.wrapped_file_key),
    wrappingKey,
    { name: "AES-GCM", iv: base64ToBytes(metadata.wrapping_key_iv) },
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );
  const encryptedBytes = await encryptedBlob.arrayBuffer();
  const decryptedBytes = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBytes(metadata.file_iv) },
    fileKey,
    encryptedBytes
  );

  return new Blob([decryptedBytes], { type: metadata.original_type || "application/octet-stream" });
}

export function buildPlaintextChecksumInput(file: File) {
  return encoder.encode(`${file.name}:${file.type}:${file.size}:${file.lastModified}`);
}
