import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "src/assets"),
    },
  },
  root: __dirname,
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  server: {
    port: 5174,
    host: true, // Listen on all local IPs to prevent localhost IPv6 resolution errors
    strictPort: false,      // Si 5174 está ocupado, busca el siguiente
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',  // IPv4 explícito — crítico en Windows
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
});

