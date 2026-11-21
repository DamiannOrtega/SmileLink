import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  test: {
    environment: "jsdom",
    globals: false,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      include: [
        "src/lib/**",
        "src/utils/**",
        "src/services/api.ts",
        "src/components/ProtectedRoute.tsx",
        "src/components/StatCard.tsx",
      ],
      reporter: ["text", "text-summary"],
      // Piso mínimo actual; subirlo conforme se agreguen pruebas.
      thresholds: { lines: 30, functions: 10, statements: 30, branches: 50 },
    },
  },
});
