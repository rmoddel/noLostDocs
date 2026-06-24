# Phase 2 Research Notes

**Date:** 2026-06-19

## Inputs Reviewed

- Current roadmap and requirements for `WEB-02`, `PORT-02`, and `PLAN-01`
- Existing NoLostDocs web prototype
- Existing shared mock data and browser-safe Supabase setup

## Findings

1. The current site already communicates brand and trust better than the earlier version, but the portal still reads like a preview section instead of a coherent workspace.
2. Phase 2 does not need live backend integration to prove the mental model. It needs stronger information hierarchy.
3. The fastest path is to keep the prototype in the current Vite app, improve the account shell, and use the shared mock snapshot as the source of truth.
4. Search and upgrade can be represented as explicit entry points without inventing fake functionality.

## Decisions Reinforced

- Keep the portal simple and believable.
- Keep web access visibly cloud-only.
- Let categories and status lead the experience.

## Risks

- Over-designing the portal before auth and real data arrive would create churn.
- Under-explaining the cloud-only boundary would blur free versus premium expectations.
