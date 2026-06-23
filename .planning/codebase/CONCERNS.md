# Codebase Concerns

## High Priority

- Web implementation and planning direction diverge: the repo ships a Vite SPA while planning still describes Next.js as the target portal stack.
- Supabase backend logic is scaffold-only: edge functions currently return placeholder JSON and do not enforce device, file, or billing flows.
- Security posture is documented but not exercised: there is no live auth, no live storage path generation, and no test coverage for RLS or storage policies.

## Medium Priority

- Product rename is incomplete internally: package names remain `@doc-wallet/*`, which is acceptable short term but will create drag if left unresolved.
- The active web prototype is still a single large component, which is fine for fast iteration but will become expensive once auth, billing, and document workflows land.
- The repo still contains a deferred mobile app, which can confuse scope and create maintenance noise during the web-first cycle.

## Low Priority

- README references `apps/mobile/.env.local.example`, but that file does not exist.
- Planning artifacts are ahead of execution in some areas and behind it in others; codebase mapping helps, but phase artifacts are still sparse.
- Vite dev server may require running outside this sandbox due to local bind restrictions, even though production build succeeds.

## Open Alignment Questions

- Stay on Vite for the flagship web experience or migrate to Next.js before auth and portal logic deepen.
- Decide when to rename internal package scope away from `doc-wallet`.
- Decide whether the mobile scaffold should stay in-repo during the web-first pass or be explicitly parked.
