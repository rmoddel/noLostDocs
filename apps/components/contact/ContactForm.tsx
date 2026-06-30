"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { submitContactRequest } from "@/lib/contact/submit";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

export function ContactForm() {
  const { client, configured } = createBrowserSupabaseClient();
  const { session } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("Client support request");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user.email) {
      return;
    }

    setEmail((current) => (current ? current : session.user.email ?? ""));
    const fullName = typeof session.user.user_metadata?.full_name === "string" ? session.user.user_metadata.full_name : "";
    setName((current) => (current ? current : fullName));
  }, [session]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStatus(null);

    const result = await submitContactRequest({
      client,
      configured,
      email,
      message,
      name,
      page: "/contact",
      session,
      subject
    });

    setLoading(false);
    setStatus(result.message);

    if (result.message.toLowerCase().includes("message sent")) {
      setSubject("Client support request");
      setMessage("");
    }
  }

  return (
    <section className="page-section contact-page">
      <div className="contact-page-grid">
        <Card className="content-card contact-intro-card">
          <p className="eyebrow">Contact</p>
          <h1>Reach the support team.</h1>
          <p className="section-copy">Messages are recorded for follow-up through the current support workflow.</p>
          <p className="section-support">{session?.user.email ? `Signed in as ${session.user.email}.` : "You may contact support from any email address."}</p>
          <ul className="note-list">
            <li>
              <strong>Client support</strong>
              <span>Billing, access, onboarding, and trust-model questions.</span>
            </li>
            <li>
              <strong>Operational detail helps</strong>
              <span>Include the route, device, browser, or account state when possible.</span>
            </li>
            <li>
              <strong>Recorded for follow-up</strong>
              <span>Messages are saved so the conversation can be reviewed and continued.</span>
            </li>
          </ul>
        </Card>

        <Card className="side-card contact-form-card">
          <div className="section-heading compact">
            <div>
              <p className="eyebrow">Message</p>
              <h3>Send a support request.</h3>
            </div>
          </div>

          <form className="auth-form contact-form" onSubmit={(event) => void handleSubmit(event)}>
            <label className="field">
              <span>Name</span>
              <input autoComplete="name" name="name" onChange={(event) => setName(event.target.value)} type="text" value={name} />
            </label>

            <label className="field">
              <span>Email</span>
              <input autoComplete="email" name="email" onChange={(event) => setEmail(event.target.value)} type="email" value={email} />
            </label>

            <label className="field">
              <span>Subject</span>
              <input name="subject" onChange={(event) => setSubject(event.target.value)} type="text" value={subject} />
            </label>

            <label className="field">
              <span>Message</span>
              <textarea name="message" onChange={(event) => setMessage(event.target.value)} rows={7} value={message} />
            </label>

            <Button disabled={loading} type="submit">
              {loading ? "Sending..." : "Send request"}
            </Button>
          </form>

          <p className="support-copy">When you are signed in, the request is recorded alongside your account context.</p>
          {status ? <p className="inline-feedback">{status}</p> : null}
        </Card>
      </div>
    </section>
  );
}
