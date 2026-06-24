import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  publicDir: fileURLToPath(new URL("../../nolostdocs_brand_assets", import.meta.url)),
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true
  },
  resolve: {
    alias: {
      "@doc-wallet/config": fileURLToPath(new URL("../../packages/config/src/index.ts", import.meta.url)),
      "@doc-wallet/supabase": fileURLToPath(new URL("../../packages/supabase/src/index.ts", import.meta.url)),
      "@doc-wallet/types": fileURLToPath(new URL("../../packages/types/src/index.ts", import.meta.url))
    }
  }
});
