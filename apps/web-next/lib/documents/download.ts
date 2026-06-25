import type { DocumentTemplate } from "@doc-wallet/types";
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

  const { data, error } = await client.functions.invoke("create-signed-download", {
    body: {
      documentId: template.id,
      documentTitle: template.title
    }
  });

  if (error) {
    return { message: error.message };
  }

  await logProtectedAction(client, session, action, template);

  const responseMessage =
    typeof data?.message === "string"
      ? data.message
      : "Authorized download flow completed. Replace this with a real signed URL flow when connected.";

  return { message: responseMessage };
}
