# Stack Research: Doc Wallet

## Recommended Stack

- **Mobile client**: Expo React Native with TypeScript
  - `expo-router` for navigation
  - `expo-secure-store` for wrapped key material and device-bound secrets
  - `expo-local-authentication` for biometric unlock
  - `expo-file-system` for encrypted local file persistence
- **Web client**: Next.js with TypeScript and Tailwind CSS
  - Server-side session handling for web login and secure portal flows
- **Backend core**: Supabase
  - Auth for cloud-enabled identities
  - Postgres for metadata and device/session state
  - Storage private buckets for encrypted blobs
  - Edge Functions for signed-access helpers, remote lock, and subscription sync
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
