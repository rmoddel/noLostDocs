---
title: Add Supabase email templates to repo and repair magic-link login callback flow
status: in_progress
created: 2026-06-30
---

Add paste-ready Supabase auth email templates to a repo-local templates directory, then switch the web login flow to the supported SSR token-hash confirmation route so magic-link sign-in actually creates a session before redirecting the user into the workspace.
