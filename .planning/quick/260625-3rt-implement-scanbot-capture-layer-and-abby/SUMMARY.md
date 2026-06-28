---
status: complete
completed: 2026-06-25
---

Implemented Scanbot/ABBYY scaffolding for the web scan flow by:
- adding a scan pipeline module that defines the selected capture and OCR layers
- surfacing the chosen stack and capture guidance in the `/scan` UI
- persisting capture/OCR provider metadata with saved scans
- updating repo docs to make the selected Phase 7 stack explicit

Verification:
- `npm run typecheck --workspace @doc-wallet/web`
- `npm run build --workspace @doc-wallet/web`
