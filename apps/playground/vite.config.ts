import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@kanava/editor": path.resolve(__dirname, "../../packages/core/src"),
      "@kanava/editor-react": path.resolve(__dirname, "../../packages/react/src"),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
