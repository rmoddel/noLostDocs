import type { Session, SupabaseClient } from "@supabase/supabase-js";

type SubmitContactArgs = {
  client: SupabaseClient;
  configured: boolean;
  email: string;
  message: string;
  name: string;
  page: string;
  session: Session | null;
  subject: string;
};

export function validateContactForm(values: { email: string; message: string; name: string; subject: string }) {
  if (!values.name.trim() || !values.email.trim() || !values.subject.trim() || !values.message.trim()) {
    return "Complete your name, email, subject, and message.";
  }

  return null;
}

export async function submitContactRequest({
  client,
  configured,
  email,
  message,
  name,
  page,
  session,
  subject
}: SubmitContactArgs) {
  const validationError = validateContactForm({ email, message, name, subject });
  if (validationError) {
    return { message: validationError };
  }

  if (!configured) {
    return { message: "Messages cannot be sent yet." };
  }

  const { data, error } = await client.functions.invoke("contact-submit", {
    body: {
      name: name.trim(),
      email: email.trim(),
      subject: subject.trim(),
      message: message.trim(),
      page,
      userId: session?.user.id ?? null
    }
  });

  if (error) {
    return { message: error.message };
  }

  return {
    message: typeof data?.message === "string" ? data.message : "Message sent. We'll review it and respond by email."
  };
}
