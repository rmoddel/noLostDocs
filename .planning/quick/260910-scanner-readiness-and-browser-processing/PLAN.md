---
title: Upgrade scanner readiness and browser processing
status: in_progress
created: 2026-09-10
---

# Plan

## Goal

Improve the scanner path that can ship without new commercial credentials, while keeping Scanbot and ABBYY clearly configuration-gated.

## Scope

- Keep Scanbot/ABBYY provider status honest when credentials are missing.
- Add browser-side image preparation before encrypted upload: rotation, conservative auto-crop, contrast/brightness normalization, and output compression.
- Avoid blocking supported uploads when browser quality inspection cannot decode a format such as HEIC.
- Surface scan quality signals in the overlay so the user gets more useful feedback before save.
- Verify build/typecheck and deploy env presence separately.

## Out Of Scope

- Do not invent or hard-code Scanbot/ABBYY license values.
- Do not claim full OCR extraction is live until ABBYY connector credentials and backend processing exist.
