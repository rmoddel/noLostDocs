# Codebase Testing

## Current Verification

- Root workspace typecheck via `npm run typecheck`
- Web production build via `npm run build:web`
- Mobile TypeScript compile has also been run successfully in prior work
- Accessibility review guidance now lives in `.planning/research/ACCESSIBILITY-EVALUATION.md`

## What Exists Today

- Type-level verification only
- Build verification for the web app
- No unit tests
- No integration tests
- No end-to-end browser tests
- No SQL policy test harness
- No edge function tests

## Practical Impact

- UI regressions will be caught late
- Supabase RLS and storage policy correctness is currently unverified in automation
- Placeholder edge functions may look complete in structure while still doing no real work

## Recommended Near-Term Additions

- Add lightweight React component or smoke tests for the web shell
- Add Supabase policy verification scripts once a project is connected
- Add function-level tests for device lock and signed download behavior
- Add a repeatable accessibility review pass for key routes, using the guidance in `.planning/research/ACCESSIBILITY-EVALUATION.md`
