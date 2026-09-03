import { defineConfig } from "vite";

export default defineConfig({
  build: {
    target: "es2020",
    lib: {
      entry: {
        index: "src/i18n/index.ts",
        client: "src/i18n/client.ts",
        server: "src/i18n/server.ts",
      },
      formats: ["es", "cjs"],
      fileName: (format, entryName) =>
        `${entryName}.${format === "es" ? "js" : "cjs"}`,
    },
    rolldownOptions: {
      external: ["react"],
    },
    sourcemap: true,
  },
});
