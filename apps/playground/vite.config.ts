import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// KANAVA_DIST=1 → resolve from built dist/ (tests the npm package output)
// default      → resolve from src/ (fast HMR during development)
const useDistMode = process.env.KANAVA_DIST === "1";

export default defineConfig({
  plugins: [react()],
  resolve: useDistMode
    ? {} // no aliases — resolves @kanava/* from node_modules (workspace → dist/)
    : {
        alias: {
          "@kanava/editor": path.resolve(__dirname, "../../packages/core/src"),
          "@kanava/editor-react": path.resolve(
            __dirname,
            "../../packages/react/src",
          ),
        },
      },
  server: {
    port: useDistMode ? 3002 : 3000,
    open: true,
  },
});
