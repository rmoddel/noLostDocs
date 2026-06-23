<!-- GSD:project-start source:PROJECT.md -->
## Project

**NoLostDocs**

NoLostDocs is a secure document vault for storing, organizing, and recovering sensitive personal and professional documents without panic, clutter, or guesswork. The immediate product objective is web-first: shape the brand, product language, trust model, portal experience, and cloud-backed document flows on the web before resuming dedicated mobile work.

**Core Value:** No more lost docs. Everything the user needs in one app.

### Constraints

- **Security**: Never store raw sensitive files unencrypted — the app handles identity, medical, vehicle, and business records.
- **Product honesty**: Do not imply legal equivalence to physical IDs or official originals — acceptance varies by institution.
- **Architecture**: Cloud-backed web access must stay explicit; local-only behavior cannot be implied to exist on web.
- **Platform**: Web-only for the current cycle — mobile work is paused until the website and portal direction are right.
- **Naming**: Use `NoLostDocs` in the product and avoid “wallet” language on the frontend.
- **Stack**: Web prototype can move fast, but the planned portal direction stays Next.js + Supabase + TypeScript.
- **Compliance posture**: Build toward HIPAA-grade patterns without marketing HIPAA compliance — legal and vendor review are deferred.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## Recommended Stack
- **Mobile client**: Expo React Native with TypeScript
- **Web client**: Next.js with TypeScript and Tailwind CSS
- **Backend core**: Supabase
- **Payments**: Stripe
- **Future heavy jobs**: AWS Lambda only when OCR/background processing demands it
## Why This Fits
- One TypeScript-heavy stack lowers coordination cost across mobile, web, and backend logic.
- Supabase covers the MVP's hardest platform primitives without forcing custom auth, storage, and database operations too early.
- Expo provides pragmatic access to camera, biometrics, and secure device storage for an Android-first release.
## What Not To Use Initially
- EC2-hosted Docker Postgres as the primary MVP backend — adds backup, hardening, patching, and recovery burden without product leverage.
- Cloud OCR in MVP — expands privacy and compliance scope before the main storage/recovery flows are reliable.
- Public storage buckets or client-visible service-role credentials — directly incompatible with the security model.
## Confidence
- **High**: Expo + Next.js + Supabase + Stripe for MVP.
- **Medium**: Choice of exact crypto helper package until implementation details are validated against Expo/native constraints.
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
