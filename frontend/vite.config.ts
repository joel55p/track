import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "Teleprogreso Track",
        short_name: "Track",
        description: "Supervisión de personal y activos — Teleprogreso S.A.",
        theme_color: "#0c4a6e",
        background_color: "#f0f9ff",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "/favicon.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "any",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,svg,png}"],
      },
    }),
  ],
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  server: {
    port: 5173,
    // BACKEND_URL se inyecta desde Docker (http://backend:8000).
    // En desarrollo local sin Docker usa el valor por defecto.
    proxy: {
      "/api":    { target: process.env.BACKEND_URL ?? "http://127.0.0.1:8000", changeOrigin: true },
      "/health": { target: process.env.BACKEND_URL ?? "http://127.0.0.1:8000", changeOrigin: true },
    },
  },
});
