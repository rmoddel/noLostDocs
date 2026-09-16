# Production readiness, scan UX, and security

Started through GSD quick initialization (legacy CLI; gsd-sdk unavailable). Preserve the existing September 10 scanner work and all unrelated edits.

1. Assess launch readiness from code and current official documentation.
2. Fix Next 15 session middleware, add browser security headers, tighten recent authentication and upload authorization.
3. Make image processing an explicit, previewed operation; fix validation, repeated-save races, and nested scanner keyboard/focus behavior.
4. Improve accessibility, empty states, and recovery-limit disclosure.
5. Run typecheck, production build, dependency audit, focused security/scan checks and available database/browser validation.
6. Record verified results and an actionable production configuration checklist, distinguishing configuration from unfinished product capabilities.

No production mutations or real sensitive documents are required for this task. Cross-device key recovery and paid checkout must not be represented as working merely because credentials exist.
