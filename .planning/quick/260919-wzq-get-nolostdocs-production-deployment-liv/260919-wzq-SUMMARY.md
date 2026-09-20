# Production release — in progress, blocked on Supabase access

## Verified infrastructure
- AWS account 422566288505, Amplify app dqlf65gf69fsp (noLostDocs), repository rmoddel/noLostDocs.
- main is PRODUCTION with automatic builds; WEB_COMPUTE. Existing job 24 succeeded for 6c2522e.
- Added nolostdocs.rmoddel.com to existing rmoddel.com association, preserved nld mapping. Amplify automatically created the exact CNAME in Route 53. Public DNS resolves; HTTPS certificate verification passed.
- Removed pre-existing SERVICE_ROLE_KEY from Amplify app-level variables without printing its value; preserved other variables. Owner-readable pre-change backup is outside the repo in /tmp.
- Set main branch NEXT_PUBLIC_SITE_URL to https://nolostdocs.rmoddel.com and AMPLIFY_MONOREPO_APP_ROOT to apps. Did not overwrite Supabase keys.
- Enabled Amplify main branch basic authentication for restricted preview. Credentials are in owner-readable /tmp/nolostdocs-preview-access.txt, not in Git.

## Prepared source changes
- Hide Google sign-in until production OAuth is verified.
- Use --workspaces in npm lint/typecheck scripts: npm 12 rejects -ws.
- Keep root amplify.yml unchanged.

## Validation
- Node 22.23.1; npm 12.0.2; AWS and Supabase CLIs installed.
- npm ci passed, audit reported zero vulnerabilities.
- npm run test:security-scan: 7/7 pass.
- npm run typecheck: pass after workspace flag correction.
- npm run build:web: pass, Middleware included.
- apps/.env.local is ignored and not staged.
- Production HTTPS: password gate returns 401 without preview credentials; login/security/privacy/contact/site.webmanifest/sitemap.xml/og-image.png return 200 with preview credentials.
- Signed-out dashboard uses a Next.js streamed redirect to /login?next=%2Fdashboard (HTTP 200 with refresh meta and NEXT_REDIRECT); no dashboard shell rendered.
- Former Amplify service-role value absent from all script bundles loaded by inspected pages. This is a scoped check, not an exhaustive audit of historic assets.
- Latest deployed release still displays Google login; the prepared removal has not been pushed because production Supabase verification is blocked.

## Required next steps / blockers
- Supabase CLI has no access token. User asked to run supabase login locally.
- Existing linked/configured project is sccjdbclijlfivuykyei. Local URL matches existing Amplify URL, but local public key is unrecognized and differs from Amplify publishable key. User asked to confirm production project and correct apps/.env.local; no key copied.
- After access and identity verification: compare migration histories, review dry-run, apply expected migrations only; inspect private bucket settings; deploy requested functions with appropriate JWT checks; configure auth URLs and SMTP.
- Need confirmation email inbox and connected browser/device for end-to-end signup, mail confirmation, login/logout, encrypted JPG/PDF roundtrip, fresh browser recovery, two-account isolation and real mobile camera testing.
- Local source changes require production deployment after backend/env gates are resolved.
- Cross-device key recovery remains unimplemented; do not remove preview restriction or declare public storage readiness.
