---
status: complete
completed: 2026-06-29
---

Updated the Amplify monorepo build contract to target the web workspace directly.

Delivered:
- `amplify.yml` now builds the Next.js app with `npm run build -w @nolostdocs/web`
- npm cache path added for more stable repeat builds

Follow-up required outside the repo:
- Ensure the Amplify app has `AMPLIFY_MONOREPO_APP_ROOT=apps/web`
