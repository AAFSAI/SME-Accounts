import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  base: "/sme-accounts/",
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        developer: resolve(__dirname, "developer.html"),
        registration: resolve(__dirname, "registration.html")
      }
    }
  },
  server: {
    host: "0.0.0.0",
    port: 4173
  }
});
