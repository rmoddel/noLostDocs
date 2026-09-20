# Paid public launch continuation

Authorized by the user's instruction to proceed to money-producing readiness. Continues the existing initialized GSD release task.

1. Complete production synthetic auth/storage/isolation checks. Preserve restricted preview until all release gates pass.
2. Implement account-scoped encrypted vault recovery: cryptographically random 256-bit recovery code, AES-GCM encrypted vault key stored under owner-only RLS, non-extractable local key, mandatory saved-code confirmation, fresh-browser unlock, and atomic rewrapping of legacy file keys from the original browser. Never upload plaintext keys or file contents. Reject migration when any old key is missing.
3. Implement authenticated Stripe Checkout/customer portal and canonical subscription reconciliation with server-owned price/customer associations, idempotency and concurrency protection. Configure test billing first; live account/price identity requires user confirmation because the supplied account is a disabled sandbox with no prices.
4. Complete account password reset, relevant UI/docs, tests and abuse/lifecycle controls required by exposed flows. Apply reviewed migrations without reset/repair, deploy, and verify actual production behavior.
5. Public launch gate: fresh-browser recovery, successful signup/confirmation and UI document flows, physical mobile camera, configured live Stripe with approved pricing and successful payment/cancellation/webhook checks. Do not claim external gates passed without evidence.

Current verified state: Amplify job 25 succeeded for 9f483b2; HTTPS and preview gate work. Production migrations through 20260908033028 match. Eight functions deployed with intended JWT settings. Bucket private/octet-stream/11 MiB. Auth production URLs and confirmation template set. SMTP credentials exist but delivery unverified. API smoke tests pass password login/logout, encrypted JPG/PDF upload/download after token refresh, two-user read/update/signing denial, direct-storage denial, lock/unlock, anonymous denial, contact persistence. Test fixtures removed.

External inputs requested: intended Stripe business/account, live onboarding and credentials, paid price/interval, confirmation-test inbox, connected browser/physical device. No live payment changes until account ambiguity is resolved.
