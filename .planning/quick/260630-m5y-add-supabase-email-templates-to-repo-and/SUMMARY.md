---
status: complete
completed: 2026-06-30
---

Added repo-local Supabase auth email templates and repaired the NoLostDocs magic-link flow to use the supported SSR token-hash confirmation route.

Delivered:
- added paste-ready branded templates in `.templates/supabase/` for magic link, confirmation, and recovery emails
- switched the login redirect builder to send users toward their final destination instead of the old code-exchange callback
- added `apps/app/auth/confirm/route.ts` to verify the token hash server-side and establish the session before redirecting
- expanded login error handling for missing token-hash and verify failures

Verification:
- `npm run typecheck -w @nolostdocs/web`
- `npm run build -w @nolostdocs/web`
