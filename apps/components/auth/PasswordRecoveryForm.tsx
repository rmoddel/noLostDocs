"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { getPublicAppUrl } from "@/lib/auth/getAuthRedirectUrl";
export function PasswordRecoveryForm({ reset = false }: { reset?: boolean }) {
  const { client } = createBrowserSupabaseClient();
  const router = useRouter();
  const [email, setEmail] = useState(""), [password, setPassword] = useState(""), [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      if (reset) {
        if (password !== confirm) throw new Error("The passwords do not match.");
        if (password.length < 12) throw new Error("Use a password with at least 12 characters.");
        const { error } = await client.auth.updateUser({ password });
        if (error) throw error;
        setPassword(""); setConfirm(""); router.replace("/dashboard");
      } else {
        await client.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${getPublicAppUrl()}/auth/callback?next=%2Freset-password` });
        setMessage("If this address has an account, you will receive a password reset email. Check your inbox and spam folder.");
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : "This request could not be completed. Try again."); }
    finally { setBusy(false); }
  }
  return <section className="page-section"><div className="content-card"><h1>{reset ? "Choose a new account password" : "Reset your account password"}</h1>
    <p>Your recovery code for encrypted documents stays the same. A password reset cannot replace a lost document recovery code.</p>
    <form className="login-form" onSubmit={(event) => void submit(event)}>
      {reset ? <>
        <label className="login-field"><span>New password</span><input type="password" autoComplete="new-password" required minLength={12} value={password} onChange={(event) => setPassword(event.target.value)} /></label>
        <label className="login-field"><span>Confirm new password</span><input type="password" autoComplete="new-password" required minLength={12} value={confirm} onChange={(event) => setConfirm(event.target.value)} /></label>
      </> : <label className="login-field"><span>Email address</span><input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>}
      <button className="button primary" disabled={busy}>{busy ? "Please wait…" : reset ? "Save new password" : "Send reset link"}</button>
    </form>{message ? <p role="status">{message}</p> : null}<p><Link href="/login?mode=signin">Back to sign in</Link></p>
  </div></section>;
}
