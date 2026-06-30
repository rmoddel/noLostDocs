import type { DocumentTemplate } from "@nolostdocs/types";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { buildAccessMessage, getDocumentAccessState, type ProtectedAction } from "./access";

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

export async function runProtectedDocumentAction({
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

  if (action === "preview") {
    if (configured && session) {
      await logProtectedAction(client, session, action, template);
    }

    return { message: baseMessage };
  }

  if (!configured || !session) {
    return {
      message: `${baseMessage} The download flow isn't connected yet.`
    };
  }

  if (!template.documentFileId) {
    return {
      message: `${template.title} does not have a protected file attached yet.`
    };
  }

  const { data, error } = await client.functions.invoke("create-signed-download", {
    body: {
      documentFileId: template.documentFileId
    }
  });

  if (error) {
    return { message: error.message };
  }

  const signedUrl = typeof data?.signedUrl === "string" ? data.signedUrl : null;

  if (!signedUrl) {
    return { message: "Signed download flow returned no URL." };
  }

  if (typeof window !== "undefined") {
    window.open(signedUrl, "_blank", "noopener,noreferrer");
  }

  await logProtectedAction(client, session, action, template);

  const expiresIn = typeof data?.expiresIn === "number" ? data.expiresIn : 60;

  return { message: `Authorized download ready. Link expires in ${expiresIn} seconds.` };
}
