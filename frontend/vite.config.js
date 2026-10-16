import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      // During development, any request to /api is forwarded to the Express
      // backend. To the browser everything is on http://localhost:5173, so the
      // HttpOnly login cookie works without any cross-origin complications.
      proxy: {
        "/api": {
          target: env.VITE_PROXY_TARGET || "http://localhost:5000",
          changeOrigin: false,
        },
      },
    },
  };
});
