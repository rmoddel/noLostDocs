# Pitfalls Research: Doc Wallet

## Major Pitfalls

### 1. Legal-replacement ambiguity
- **Warning signs**: Product copy implies acceptance everywhere; onboarding omits the limitation.
- **Prevention**: Put the warning into onboarding, settings, and marketing copy from the start.
- **Phase**: 1

### 2. RLS and storage path mismatch
- **Warning signs**: Database policies are correct but storage paths or signed-download helpers bypass user ownership checks.
- **Prevention**: Treat storage path conventions and RLS tests as first-class deliverables.
- **Phase**: 3 and 6

### 3. Secret leakage to clients
- **Warning signs**: Service-role keys, admin endpoints, or unrestricted edge helpers show up in client code.
- **Prevention**: Isolate privileged logic in server-only environments and audit config before release.
- **Phase**: 3 and 6

### 4. Local-only promises that are not technically enforced
- **Warning signs**: Analytics, sync, or upload code runs for local-only users.
- **Prevention**: Add explicit mode guards and verify that local-only flows make no document uploads.
- **Phase**: 2 and 6

### 5. Recovery UX that conflicts with encryption claims
- **Warning signs**: Product claims zero-knowledge while recovery depends on server-held plaintext keys or undeclared key escrow.
- **Prevention**: Decide the recovery model before launch and align copy to the actual cryptographic behavior.
- **Phase**: 1 and 5

### 6. Shipping OCR too early
- **Warning signs**: Team starts optimizing search before restore and remote lock are trustworthy.
- **Prevention**: Keep OCR explicitly out of MVP and require phase-level approval before reintroducing it.
- **Phase**: Deferred
