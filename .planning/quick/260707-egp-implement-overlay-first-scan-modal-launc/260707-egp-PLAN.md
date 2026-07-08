# Quick Task 260707-egp: Implement overlay-first scan modal launched from dashboard

Date: 2026-07-07

## Goal

Make the dashboard the document home and turn scan into an action overlay launched from dashboard controls. Keep `/scan` and `/scanner` as protected redirect fallbacks into `/dashboard?scan=open`.

## Tasks

1. Convert the scan workspace into a reusable metadata-first overlay component.
   - Use dashboard profiles, categories, and document types as explicit selectors.
   - Keep camera/upload, preview, rotate, validation, and save behavior.
   - Close and report success through callbacks instead of navigating away.

2. Wire dashboard scan actions to local overlay state.
   - Replace dashboard `/scan` links with buttons.
   - Support `/dashboard?scan=open` by opening the overlay after mount.
   - Refresh or append dashboard document data after save.

3. Update protected fallback routes and verify.
   - Redirect `/scan` and `/scanner` to `/dashboard?scan=open`.
   - Build the web app and fix type/style regressions.
