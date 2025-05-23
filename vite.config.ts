
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Don't replace runtime environment variables
  define: {
    // Add this to handle the Deno global in browser builds
    "Deno": "undefined"
  },
  // Exclude env-config.js from processing
  build: {
    rollupOptions: {
      external: ['/env-config.js']
    }
  }
}));
