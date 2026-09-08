import type { DocumentTemplate } from "@nolostdocs/types";

export const CLIENT_ENCRYPTION_VERSION = "client-webcrypto-aes-gcm-local-device-v1";

const DB_NAME = "nolostdocs-vault-keys";
const DB_VERSION = 1;
const STORE_NAME = "wrappingKeys";
const LOCAL_KEY_ID = "nolostdocs:vault-wrapping-key-id";
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
  scheme: typeof CLIENT_ENCRYPTION_VERSION;
  wrapped_file_key: string;
  wrapping_key_id: string;
  wrapping_key_scope: "local-device";
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

async function readStoredWrappingKey(id: string) {
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

async function writeStoredWrappingKey(storedKey: StoredWrappingKey) {
  const database = await openKeyDatabase();

  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    const request = transaction.objectStore(STORE_NAME).put(storedKey);

    request.onerror = () => reject(request.error ?? new Error("Unable to store the local vault key."));
    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error ?? new Error("Unable to store the local vault key."));
    };
  });
}

async function generateWrappingKey() {
  const key = await window.crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, [
    "wrapKey",
    "unwrapKey"
  ]);

  return key;
}

async function getOrCreateLocalWrappingKey() {
  requireBrowserCrypto();

  const existingId = window.localStorage.getItem(LOCAL_KEY_ID);
  if (existingId) {
    const existing = await readStoredWrappingKey(existingId);
    if (existing?.key) {
      return existing;
    }
  }

  const id = window.crypto.randomUUID();
  const storedKey = {
    createdAt: new Date().toISOString(),
    id,
    key: await generateWrappingKey()
  };

  await writeStoredWrappingKey(storedKey);
  window.localStorage.setItem(LOCAL_KEY_ID, id);
  return storedKey;
}

function encryptedFileName(fileName: string) {
  return `${fileName.replace(/\s+/g, "-")}.nld.enc`;
}

export function getEncryptionMetadata(template: DocumentTemplate) {
  return template.encryptedFileKey as ClientEncryptionMetadata | undefined;
}

export function isLocallyEncryptedDocument(template: DocumentTemplate) {
  return template.encryptionVersion === CLIENT_ENCRYPTION_VERSION && Boolean(getEncryptionMetadata(template));
}

export async function encryptFileForLocalDevice(file: File): Promise<EncryptedFilePayload> {
  requireBrowserCrypto();

  const wrappingKey = await getOrCreateLocalWrappingKey();
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
    wrapping_key_scope: "local-device",
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

export async function decryptFileFromLocalDevice(encryptedBlob: Blob, metadata: ClientEncryptionMetadata) {
  requireBrowserCrypto();

  const wrappingKey = await readStoredWrappingKey(metadata.wrapping_key_id);
  if (!wrappingKey?.key) {
    throw new Error("This file was encrypted from another browser. Recovery key support is not configured yet.");
  }

  const fileKey = await window.crypto.subtle.unwrapKey(
    "raw",
    base64ToBytes(metadata.wrapped_file_key),
    wrappingKey.key,
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
