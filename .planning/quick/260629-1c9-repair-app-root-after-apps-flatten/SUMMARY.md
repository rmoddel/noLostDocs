---
status: complete
completed: 2026-06-29
---

Repaired the active repo wiring after moving the live app into `apps`.

Delivered:
- root workspace config now includes the live app at `apps`
- Amplify build config now targets `apps` for `appRoot` and artifacts
- runtime asset metadata and README references updated from `apps/web` to `apps`
- new `apps/.env.local.example` added for the flattened app layout
