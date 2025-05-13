
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
  // Define for Deno global in browser builds
  define: {
    // Add this to handle the Deno global in browser builds
    "Deno": "undefined"
  },
  optimizeDeps: {
    include: ['crypto-js']
  },
  build: {
    commonjsOptions: {
      include: [/crypto-js/, /node_modules/]
    }
  }
}));
