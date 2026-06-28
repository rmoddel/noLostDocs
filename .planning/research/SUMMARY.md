# Research Summary: Doc Wallet

## Stack

The strongest MVP path is an Expo React Native mobile app, a Next.js web portal, and Supabase for auth, Postgres, storage, and edge logic. This matches the requested TypeScript-first stack and minimizes avoidable infrastructure work.

## Table Stakes

The minimum credible product is not just storage. It includes wallet-style organization, encrypted local persistence, scan/import, explicit local-only versus cloud behavior, restore on a new device for premium users, and remote lock for lost devices.

## Watch Out For

- Do not blur the line between helpful copy and legal replacement claims.
- Do not treat RLS as sufficient if storage path authorization is weaker.
- Do not claim stronger privacy guarantees than the recovery/encryption design actually supports.
- Do not expand into OCR or sharing before storage, restore, and device lock behavior are proven.
- Do not treat accessibility as optional; it is part of engineering quality and trust.
