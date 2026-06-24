# Phase 4 UI Design Contract

**Phase:** 04 - Cloud Document Dashboard
**Date:** 2026-06-23
**Status:** Ready

## Intent

The signed-in dashboard should feel like the unlocked continuation of the public launcher: large category cards first, smaller document actions second, and a more explicit trust model around secure access.

## Required UI Outcomes

1. Category cards remain the dominant visual entry point on desktop and mobile.
2. Document detail becomes more informative than the current list row alone, including status, expiration, completeness, and protected action posture.
3. Visible versus hidden categories can be managed from the dashboard without leaving the main browsing flow.
4. Protected file actions are visually differentiated from normal list browsing.

## Interaction Contract

- Selecting a category updates the main document workspace.
- Selecting a document reveals a dedicated detail surface in the dashboard context.
- Hidden categories remain restorable from the same screen.
- Protected actions must communicate authorization state before claiming success.

## Visual Direction

- Preserve the current Fraunces + Manrope editorial system and warm neutral palette.
- Maintain parity between signed-out and signed-in shells.
- Use denser information only inside the document-detail surface, not by flattening the whole dashboard into a table.

## Anti-Goals

- Do not make the signed-in dashboard look like a generic file manager.
- Do not imply that clicking a web action is the same as owning an unrestricted local file.
- Do not demote category cards below document rows.
