# Production deployment

Authorized by the production launch runbook. GSD quick initialized with the installed gsd-tools CLI (gsd-sdk unavailable).

1. Verify existing infrastructure and production identity; back up and sanitize Amplify environments, configure the requested hostname without removing the existing hostname.
2. Verify Supabase project, migration history, private storage, protected functions, auth URLs and SMTP; apply only reviewed changes. Stop on ambiguous resources or migration conflicts.
3. Run npm ci, security tests, typecheck and production build; commit intended changes only, deploy main, and verify the actual production URL and end-to-end flows.

Constraints: no resets, history repairs, public storage, secret disclosure, or plaintext documents. Keep access restricted until secure cross-device encryption-key recovery exists. Unavailable authentication, SMTP, mailbox or physical camera access must be reported as unverified blockers.

Verification: successful Amplify job, valid HTTPS on nolostdocs.rmoddel.com, matching Supabase project, current migrations, private bucket and authenticated isolation tests; distinguish production preview from public launch.
