import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
      // The library is not on npm yet: the site runs on its local source.
      "cute-avatars": path.resolve(import.meta.dirname, "../src/index.ts"),
    },
    // ../src would otherwise resolve the repo root's own React from
    // ../node_modules, and two copies of React break hooks.
    dedupe: ["react", "react-dom"],
  },
})
