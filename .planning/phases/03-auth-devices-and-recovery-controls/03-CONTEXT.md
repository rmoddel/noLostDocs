# Phase 3: Auth, Devices, and Recovery Controls - Context

**Gathered:** 2026-06-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Add a real web auth and trusted-device control shell that activates once Supabase credentials are connected. This phase includes sign-in UX, session awareness, device visibility, and remote lock/unlock hooks. It does not add billing, file retrieval, or full account settings.

</domain>

<decisions>
## Implementation Decisions

- **D-01:** Use Supabase Auth directly from the Vite client with publishable credentials only.
- **D-02:** Support password sign-in and passwordless magic-link entry points in the portal shell.
- **D-03:** Keep the app useful without credentials by falling back to demo-mode messaging instead of breaking.
- **D-04:** Devices should be fetched from the `devices` table when signed in and mocked otherwise.
- **D-05:** Remote lock and unlock should call code-owned Supabase Edge Functions instead of embedding admin behavior in the client.
- **D-06:** Shared-device warnings should appear in the security surface and account panel.

</decisions>

<canonical_refs>
## Canonical References

- `apps/web/src/App.tsx`
- `apps/web/src/styles.css`
- `packages/supabase/src/index.ts`
- `supabase/functions/register-device/index.ts`
- `supabase/functions/lock-device/index.ts`
- `supabase/functions/unlock-device/index.ts`
- `supabase/migrations/20260618_000002_core_schema.sql`
- `supabase/migrations/20260618_000004_rls.sql`

</canonical_refs>

---

*Phase: 03-auth-devices-and-recovery-controls*
*Context gathered: 2026-06-19*
