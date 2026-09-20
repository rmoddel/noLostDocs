"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { createRecoveryEnvelope, unlockRecoveryEnvelope, type RecoveryEnvelope } from "@/lib/vault/crypto";
import { activateRecovery, type PendingRecovery } from "@/lib/vault/recovery";
import { getRecoveryEnvelope, readVaultKey, storeVaultKey } from "@/lib/vault/store";
export function RecoveryPanel({ userId }: { userId: string }) {
  const [envelope, setEnvelope] = useState<RecoveryEnvelope | null>(null);
  const [pending, setPending] = useState<PendingRecovery | null>(null);
  const [code, setCode] = useState("");
  const [ready, setReady] = useState(false), [unlocked, setUnlocked] = useState(false), [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const refresh = useCallback(async () => {
    const next = await getRecoveryEnvelope(userId);
    setEnvelope(next);
    setUnlocked(Boolean(next && await readVaultKey(userId, next.vault_key_id)));
    setReady(true);
  }, [userId]);
  useEffect(() => { void refresh().catch(() => setMessage("Recovery settings could not be loaded. Reload to try again.")); }, [refresh]);
  async function run(action: () => Promise<void>) {
    setBusy(true); setMessage("");
    try { await action(); } catch (error) { setMessage(error instanceof Error ? error.message : "Please try again."); }
    finally { setBusy(false); }
  }
  function downloadCode() {
    if (!pending) return;
    const blob = new Blob([`NoLostDocs recovery code\n\n${pending.code}\n\nKeep this privately, separate from your device. Sign in to your account, then enter this code at https://nolostdocs.rmoddel.com/recovery to unlock documents. NoLostDocs cannot replace a lost recovery code.\n`], { type: "text/plain" });
    const url = URL.createObjectURL(blob), link = document.createElement("a");
    link.href = url; link.download = "NoLostDocs-recovery-code.txt"; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <section className="page-section"><div className="content-card">
    <p className="eyebrow">Document recovery</p><h1>Keep a way back to your documents.</h1>
    <p>Save your recovery code somewhere safe, separate from this device. On another browser, sign in and enter the code here to unlock your encrypted files.</p>
    <p>Your account password and recovery code have different jobs. A password reset does not replace a lost recovery code. Keep your originals and an independent backup.</p>
    {!ready && !message ? <p role="status">Loading recovery settings…</p> : null}
    {ready && !envelope && !pending ? <>
      <p>Set up recovery before saving new documents. Older encrypted files need their original browser during this one-time setup.</p>
      <button className="button primary" disabled={busy} onClick={() => void run(async () => setPending(await createRecoveryEnvelope(userId)))}>Create recovery code</button>
    </> : null}
    {pending && !envelope ? <>
      <h2>Save this code privately.</h2>
      <p>Anyone with this code and access to your account can open your documents. We cannot send you a replacement.</p>
      <pre className="recovery-code">{pending.code}</pre>
      <button className="button secondary" type="button" onClick={downloadCode}>Download recovery code</button>
      <form className="login-form" onSubmit={(event) => { event.preventDefault(); void run(async () => {
        const count = await activateRecovery(userId, pending, code);
        setCode(""); setPending(null); await refresh(); setMessage(`Recovery is ready. ${count} older file keys migrated. Test your saved code in another browser before relying on it.`);
      }); }}>
        <label className="login-field"><span>Re-enter the code from your saved copy</span><input autoComplete="off" spellCheck={false} value={code} onChange={(event) => setCode(event.target.value)} required /></label>
        <button className="button primary" disabled={busy}>{busy ? "Securing recovery…" : "Confirm saved code and enable recovery"}</button>
      </form>
    </> : null}
    {envelope ? <>
      <h2>{unlocked ? "This browser is unlocked." : "Unlock this browser."}</h2>
      <p>{unlocked ? "Your recovery code can unlock your files in another browser after you sign in." : "Enter your saved recovery code. It is used in this browser and is never sent to our servers."}</p>
      {!unlocked ? <form className="login-form" onSubmit={(event) => { event.preventDefault(); void run(async () => {
        const key = await unlockRecoveryEnvelope(userId, envelope, code);
        await storeVaultKey(userId, envelope.vault_key_id, key); setCode(""); await refresh(); setMessage("This browser can now open your encrypted documents.");
      }); }}>
        <label className="login-field"><span>Recovery code</span><input type="password" autoComplete="off" spellCheck={false} value={code} onChange={(event) => setCode(event.target.value)} required /></label>
        <button className="button primary" disabled={busy}>{busy ? "Unlocking…" : "Unlock documents"}</button>
      </form> : null}
    </> : null}
    {message ? <p role="status">{message}</p> : null}
    <p><Link href="/dashboard">Back to documents</Link></p>
  </div></section>;
}
