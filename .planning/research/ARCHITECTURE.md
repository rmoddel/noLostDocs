# Architecture Research: Doc Wallet

## Core Components

- **Mobile app**
  - Onboarding, unlock, scan/import, local document management
  - Local encryption and device-bound key handling
  - Optional cloud sync client
- **Web portal**
  - Account access, device management, cloud document dashboard, recovery flows
- **Shared packages**
  - Types, crypto helpers, Supabase clients, shared config
- **Supabase backend**
  - Auth, Postgres metadata, private storage, edge functions
- **Billing backend path**
  - Stripe webhook integration and subscription state updates

## Data Flow

1. User scans or imports a document on mobile.
2. Mobile encrypts file content before persistence.
3. In local-only mode, encrypted content stays on-device and metadata remains local.
4. In cloud mode, encrypted blobs upload to private storage and metadata writes to Postgres.
5. Web portal or new mobile device reads only authorized metadata, then requests short-lived access to encrypted blobs.
6. Remote lock updates device state centrally; clients must check that state before sync or download.

## Suggested Build Order

1. Monorepo and shared packages
2. Mobile onboarding and local encryption primitives
3. Local vault UX
4. Supabase schema, RLS, and storage conventions
5. Cloud sync and restore
6. Web recovery and remote lock
7. Billing enforcement
8. Security tests and launch hardening

## Boundary Rules

- The client never receives service-role credentials.
- The server should not need plaintext document contents for normal storage flows.
- Web access is a premium cloud feature, not an entitlement for local-only users.
