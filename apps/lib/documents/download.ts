import type { DocumentTemplate } from "@nolostdocs/types";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { getBrowserFingerprint } from "@/lib/devices/actions";
import { buildAccessMessage, getDocumentAccessState, type ProtectedAction } from "./access";
import { decryptFileFromLocalDevice, getEncryptionMetadata, isLocallyEncryptedDocument } from "./encryption";

type ProtectedDocumentActionArgs = {
  action: ProtectedAction;
  client: SupabaseClient;
  configured: boolean;
  session: Session | null;
  template: DocumentTemplate;
};

async function logProtectedAction(client: SupabaseClient, session: Session | null, action: ProtectedAction, template: DocumentTemplate) {
  if (!session) {
    return;
  }

  await client.functions.invoke("audit-log", {
    body: {
      action: `${action}-document`,
      deviceFingerprint: getBrowserFingerprint(),
      resourceType: "document-template",
      resourceId: template.id,
      metadata: {
        title: template.title,
        category: template.category,
        accessState: getDocumentAccessState(template)
      }
    }
  });
}

function getDownloadName(template: DocumentTemplate) {
  return template.originalFilename ?? `${template.title.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "document"}`;
}

async function resolveProtectedUrl(signedUrl: string, template: DocumentTemplate) {
  if (!isLocallyEncryptedDocument(template)) {
    return {
      encrypted: false,
      revoke: () => undefined,
      url: signedUrl
    };
  }

  const metadata = getEncryptionMetadata(template);
  if (!metadata) {
    throw new Error("Encrypted file metadata is missing.");
  }

  const response = await fetch(signedUrl);
  if (!response.ok) {
    throw new Error("Unable to retrieve the encrypted file.");
  }

  const decryptedBlob = await decryptFileFromLocalDevice(await response.blob(), metadata);
  const url = URL.createObjectURL(decryptedBlob);

  return {
    encrypted: true,
    revoke: () => URL.revokeObjectURL(url),
    url
  };
}

function openResolvedUrl(action: ProtectedAction, url: string, template: DocumentTemplate) {
  if (typeof window === "undefined") {
    return;
  }

  if (action === "download") {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = getDownloadName(template);
    anchor.rel = "noopener noreferrer";
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    return;
  }

  window.open(url, "_blank", "noopener,noreferrer");
}

export async function createProtectedDocumentUrl({
  action,
  client,
  configured,
  session,
  template
}: ProtectedDocumentActionArgs) {
  const accessState = getDocumentAccessState(template);
  const baseMessage = buildAccessMessage(action, template);

  if (accessState !== "available") {
    if (configured && session) {
      await logProtectedAction(client, session, action, template);
    }

    return { message: baseMessage };
  }

  if (!configured || !session) {
    return {
      message: `${baseMessage} Protected file retrieval is not available right now.`
    };
  }

  if (!template.documentFileId) {
    return {
      message: `${template.title} does not have a protected file attached yet.`
    };
  }

  const { data, error } = await client.functions.invoke("create-signed-download", {
    body: {
      deviceFingerprint: getBrowserFingerprint(),
      documentFileId: template.documentFileId
    }
  });

  if (error) {
    return { message: error.message };
  }

  const signedUrl = typeof data?.signedUrl === "string" ? data.signedUrl : null;

  if (!signedUrl) {
    return { message: "No signed file link was returned." };
  }

  const resolved = await resolveProtectedUrl(signedUrl, template);

  await logProtectedAction(client, session, action, template);

  const expiresIn = typeof data?.expiresIn === "number" ? data.expiresIn : 60;

  return {
    encrypted: resolved.encrypted,
    expiresIn,
    message:
      action === "preview"
        ? `${resolved.encrypted ? "Local decrypted preview" : "Protected preview"} is ready. Link expires in ${expiresIn} seconds.`
        : `${resolved.encrypted ? "Local decrypted download" : "Protected download"} is ready. Link expires in ${expiresIn} seconds.`,
    revoke: resolved.revoke,
    url: resolved.url
  };
}

export async function runProtectedDocumentAction(args: ProtectedDocumentActionArgs) {
  const result = await createProtectedDocumentUrl(args);

  if (result.url) {
    openResolvedUrl(args.action, result.url, args.template);
    if (result.encrypted) {
      window.setTimeout(result.revoke, 60_000);
    }
  }

  return {
    message: result.message
  };
}
