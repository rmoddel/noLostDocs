import type { Session, SupabaseClient } from "@supabase/supabase-js";

const ALLOWED_SCAN_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);
export const MAX_SCAN_FILE_BYTES = 10 * 1024 * 1024;

export function validateScanFile(file: File | null) {
  if (!file) {
    return "Choose a document image first.";
  }

  if (!ALLOWED_SCAN_TYPES.has(file.type)) {
    return "Use a JPG, PNG, WebP, or HEIC image.";
  }

  if (file.size > MAX_SCAN_FILE_BYTES) {
    return "Use an image smaller than 10 MB.";
  }

  return null;
}

export function buildDisplayFileName(baseName: string) {
  return baseName.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "scan";
}

export async function rotateImageFile(file: File, rotation: number) {
  const angle = ((rotation % 360) + 360) % 360;
  const blobUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Unable to load the selected image."));
      img.src = blobUrl;
    });

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Canvas is not available in this browser.");
    }

    const swapDimensions = angle === 90 || angle === 270;
    canvas.width = swapDimensions ? image.height : image.width;
    canvas.height = swapDimensions ? image.width : image.height;

    context.translate(canvas.width / 2, canvas.height / 2);
    context.rotate((angle * Math.PI) / 180);
    context.drawImage(image, -image.width / 2, -image.height / 2);

    const mimeType = file.type || "image/jpeg";

    const rotatedBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Unable to process the scan image."));
          return;
        }

        resolve(blob);
      }, mimeType, 0.95);
    });

    return new File([rotatedBlob], file.name, { type: mimeType, lastModified: Date.now() });
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

type SaveScanArgs = {
  client: SupabaseClient;
  configured: boolean;
  documentTitle: string;
  file: File;
  groupId: string;
  groupTitle: string;
  rotation: number;
  session: Session;
};

function getFileExtension(fileName: string, mimeType: string) {
  const match = fileName.match(/\.([a-z0-9]+)$/i);
  if (match?.[1]) {
    return match[1].toLowerCase();
  }

  if (mimeType.includes("jpeg")) return "jpg";
  if (mimeType.includes("png")) return "png";
  if (mimeType.includes("webp")) return "webp";
  if (mimeType.includes("heic")) return "heic";
  return "jpg";
}

export async function saveScan({
  client,
  configured,
  documentTitle,
  file,
  groupId,
  groupTitle,
  rotation,
  session
}: SaveScanArgs) {
  if (!configured) {
    throw new Error("Scan saving is not ready yet.");
  }

  const validationError = validateScanFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const rotatedFile = rotation ? await rotateImageFile(file, rotation) : file;
  const safeTitle = buildDisplayFileName(documentTitle);

  const uploadResponse = await client.functions.invoke("create-signed-upload", {
    body: {
      documentTitle,
      fileName: rotatedFile.name,
      mimeType: rotatedFile.type,
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

  const uploadResult = await client.storage.from("user-documents").uploadToSignedUrl(payload.path, payload.token, rotatedFile, {
    contentType: rotatedFile.type || "image/jpeg",
    upsert: true
  });

  if (uploadResult.error) {
    throw new Error(uploadResult.error.message);
  }

  const { data: documentRow, error: documentError } = await client
    .from("documents")
    .insert({
      user_id: session.user.id,
      title: documentTitle,
      description: `Captured from ${groupTitle}`,
      status: "uploaded",
      metadata: {
        scan: true,
        category: groupId,
        source: "web-scan"
      }
    })
    .select("id")
    .single();

  if (documentError) {
    throw new Error(documentError.message);
  }

  const fileInsert = await client.from("document_files").insert({
    document_id: documentRow.id,
    user_id: session.user.id,
    storage_bucket: "user-documents",
    storage_path: payload.path,
    local_only: false,
    mime_type: rotatedFile.type || "image/jpeg",
    size_bytes: rotatedFile.size,
    encryption_version: "v1"
  });

  if (fileInsert.error) {
    throw new Error(fileInsert.error.message);
  }
}
