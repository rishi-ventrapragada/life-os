import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Node environment (pure date logic, no DOM) + the project's `@/` alias so tests
// import utilities the same way the app does (see tsconfig `paths`).
export default defineConfig({
  test: { environment: "node" },
  resolve: { alias: { "@": fileURLToPath(new URL("./", import.meta.url)) } },
});
