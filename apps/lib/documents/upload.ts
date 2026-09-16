import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { getBrowserFingerprint, registerBrowser } from "@/lib/devices/actions";
import { prepareScanImageForUpload } from "@/lib/scan/imageProcessing";
import { encryptFileForLocalDevice } from "./encryption";

const ALLOWED_SCAN_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "application/pdf"]);
export const MAX_SCAN_FILE_BYTES = 10 * 1024 * 1024;

export function validateScanFile(file: File | null) {
  if (!file) {
    return "Choose a document image or PDF first.";
  }

  if (!ALLOWED_SCAN_TYPES.has(file.type)) {
    return "Use a JPG, PNG, WebP, HEIC, or PDF file.";
  }

  if (file.size === 0) {
    return "This file is empty. Choose another document.";
  }

  if (file.size > MAX_SCAN_FILE_BYTES) {
    return "Use a file smaller than 10 MB.";
  }

  return null;
}

export function buildDisplayFileName(baseName: string) {
  return baseName.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "scan";
}

type SaveScanArgs = {
  categoryId: string;
  client: SupabaseClient;
  configured: boolean;
  documentTypeId: string;
  documentTitle: string;
  file: File;
  ownerProfileId: string;
  rotation: number;
  scanMetadata?: Record<string, unknown>;
  session: Session;
};

export async function saveScan({
  categoryId,
  client,
  configured,
  documentTypeId,
  documentTitle,
  file,
  ownerProfileId,
  rotation,
  scanMetadata,
  session
}: SaveScanArgs) {
  if (!configured) {
    throw new Error("Save is unavailable right now.");
  }

  const validationError = validateScanFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  if (!ownerProfileId || !categoryId || !documentTypeId) {
    throw new Error("Choose an owner, category, and document type before saving.");
  }

  const registration = await registerBrowser(client, configured, session);
  if (!registration.ok) throw new Error(registration.message);

  const preparedScan = await prepareScanImageForUpload(file, rotation);
  const uploadFile = preparedScan.file;
  const preparedError = validateScanFile(uploadFile);
  if (preparedError) throw new Error(preparedError);
  const encryptedPayload = await encryptFileForLocalDevice(uploadFile);
  const encryptedFile = encryptedPayload.file;
  const safeTitle = buildDisplayFileName(documentTitle);
  let documentId: string | null = null;
  let uploadedPath: string | null = null;

  const uploadResponse = await client.functions.invoke("create-signed-upload", {
    body: {
      deviceFingerprint: getBrowserFingerprint(),
      documentTitle,
      fileName: encryptedFile.name,
      mimeType: encryptedFile.type,
      originalFileName: uploadFile.name,
      originalMimeType: uploadFile.type,
      safeTitle
    }
  });

  if (uploadResponse.error) {
    throw new Error(uploadResponse.error.message);
  }

  const payload = uploadResponse.data as
    | {
        path: string;
        token: string;
      }
    | null;

  if (!payload?.path || !payload.token) {
    throw new Error("Upload authorization failed.");
  }

  const uploadResult = await client.storage.from("user-documents").uploadToSignedUrl(payload.path, payload.token, encryptedFile, {
    contentType: encryptedFile.type
  });

  if (uploadResult.error) {
    throw new Error(uploadResult.error.message);
  }

  uploadedPath = payload.path;

  const { data: documentRow, error: documentError } = await client
    .from("documents")
    .insert({
      user_id: session.user.id,
      owner_profile_id: ownerProfileId,
      category_id: categoryId,
      document_type_id: documentTypeId,
      title: documentTitle,
      status: "active",
      issue_date: null,
      expiration_date: null,
      document_date: null,
      metadata: {
        scan: {
          rotation,
          processing: preparedScan.metadata,
          source: "dashboard-overlay",
          ...(scanMetadata ?? {})
        }
      },
      notes: "Captured with NoLostDocs scan",
      tags: ["scan"]
    })
    .select("id")
    .single();

  if (documentError) {
    await cleanupUploadedFile(client, uploadedPath);
    throw new Error(documentError.message);
  }

  documentId = documentRow.id;

  const fileInsert = await client.from("document_files").insert({
    document_id: documentRow.id,
    user_id: session.user.id,
    storage_bucket: "user-documents",
    storage_path: payload.path,
    original_filename: uploadFile.name,
    content_type: uploadFile.type || "image/jpeg",
    file_role: "original",
    mime_type: encryptedFile.type,
    size_bytes: encryptedFile.size,
    page_count: null,
    encryption_version: encryptedPayload.encryptionVersion,
    encrypted_file_key: encryptedPayload.encryptionMetadata
  });

  if (fileInsert.error) {
    await cleanupUploadedFile(client, uploadedPath);
    await cleanupDocumentRow(client, documentId);
    throw new Error(fileInsert.error.message);
  }

  await client.functions.invoke("audit-log", {
    body: {
      action: "document.created",
      deviceFingerprint: getBrowserFingerprint(),
      resourceId: documentRow.id,
      resourceType: "document",
      metadata: {
        category_id: categoryId,
        document_type_id: documentTypeId,
        encrypted: true,
        encryption_version: encryptedPayload.encryptionVersion,
        original_file_name: uploadFile.name,
        owner_profile_id: ownerProfileId
      }
    }
  });
}

async function cleanupUploadedFile(client: SupabaseClient, path: string | null) {
  if (!path) {
    return;
  }

  await client.functions.invoke("cleanup-uploaded-file", {
    body: {
      deviceFingerprint: getBrowserFingerprint(),
      path
    }
  });
}

async function cleanupDocumentRow(client: SupabaseClient, documentId: string | null) {
  if (!documentId) {
    return;
  }

  await client.from("documents").delete().eq("id", documentId);
}
