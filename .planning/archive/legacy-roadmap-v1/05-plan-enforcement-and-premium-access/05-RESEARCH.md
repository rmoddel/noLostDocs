# Phase 5 Research Notes

**Date:** 2026-06-23

## Findings

1. The schema already contains enough primitives to model plan state: `profiles.plan`, `profiles.cloud_enabled`, and `subscriptions`.
2. The cleanest free/basic boundary in the current UI is the existing `Basic` launcher group on web and its matching personal/driving/travel categories on mobile.
3. The backend does not yet enforce any meaningful quota or subscription eligibility, so the upload edge function is the best current place to add a real server-owned gate.

## Outcome

Phase 5 should connect profile + subscription state, expose plan status in the UI, gate non-basic groups for free users, and enforce at least a conservative upload quota on the backend.
