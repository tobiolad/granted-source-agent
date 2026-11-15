import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, ".")
    }
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    globalSetup: ["./tests/global-setup.ts"],
    env: {
      DATABASE_URL: `file:${path.resolve(__dirname, "tests/test.db")}`,
      GEMINI_API_KEY: ""
    },
    globals: true,
    // Several test files share one SQLite file for API-route integration
    // tests; running files in parallel caused cross-file row deletion races.
    fileParallelism: false,
    exclude: ["node_modules", ".next", "eval/**"]
  }
});
