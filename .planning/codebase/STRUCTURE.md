# Codebase Structure

## Top Level

- `apps/`: application entry points
- `packages/`: shared workspace packages
- `supabase/`: schema, policy, seed, and edge function scaffolding
- `.planning/`: GSD planning artifacts and project management files

## Applications

### `apps/web`

- `src/App.tsx`: primary NoLostDocs prototype page and portal shell
- `src/styles.css`: custom visual system and component styling
- `src/main.tsx`: React entry point
- `vite.config.ts`: bundler config and workspace aliases

### `apps/mobile`

- `App.tsx`: mobile prototype shell
- `index.js`: Expo root registration fix for monorepo startup
- `app.json`, `babel.config.js`, `tsconfig.json`: Expo configuration

## Shared Packages

### `packages/config`

- Shared placeholder env defaults
- Shared demo snapshot data used by the current prototypes

### `packages/types`

- Shared product-facing types for categories, document states, devices, and vault snapshots

### `packages/supabase`

- Shared Supabase client initialization and placeholder-safe env resolution

## Supabase

### `supabase/migrations`

- Extensions
- Core schema
- Updated-at triggers
- RLS policies
- Storage bucket and object policies

### `supabase/functions`

- `_shared/`: common helpers
- `register-device`
- `lock-device`
- `unlock-device`
- `create-signed-upload`
- `create-signed-download`
- `stripe-webhook`
- `audit-log`

