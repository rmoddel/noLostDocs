# Codebase Concerns

## High Priority

- Web implementation and planning direction diverge: the repo ships a Vite SPA while planning still describes Next.js as the target portal stack.
- Supabase backend logic is scaffold-only: edge functions currently return placeholder JSON and do not enforce device, file, or billing flows.
- Security posture is documented but not exercised: there is no live auth, no live storage path generation, and no test coverage for RLS or storage policies.

## Medium Priority

- The Scanbot and ABBYY selections are product-approved, but live commercial credentials and backend connector setup still need to happen outside the repo.
- The repo still contains a deferred mobile app, which can confuse scope and create maintenance noise during the web-first cycle.

## Low Priority

- README references `apps/mobile/.env.local.example`, but that file does not exist.
- Planning artifacts are ahead of execution in some areas and behind it in others; codebase mapping helps, but phase artifacts are still sparse.
- Vite dev server may require running outside this sandbox due to local bind restrictions, even though production build succeeds.

## Open Alignment Questions

- Decide whether the mobile scaffold should stay in-repo during the web-first pass or be explicitly parked.
- Decide when the deploy environment should turn on the Scanbot and ABBYY connectors for the live product.
