# Phase 2: Asset and Design Source-of-Truth Cleanup - Context

**Gathered:** 2026-06-24
**Status:** Complete

## Objective

Establish one clear runtime asset source for the Next app and tighten the shared design surface so later auth and dashboard work land on a stable base.

## Scope

- Keep all runtime references inside `apps/web-next/public`
- Preserve `web_assets` as the archive/source package
- Do not swap or delete legacy asset folders yet
- Tighten the asset and design system without porting feature behavior
