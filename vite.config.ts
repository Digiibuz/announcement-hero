
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
// Utiliser l'import nommé au lieu de l'import par défaut
import { terser } from 'rollup-plugin-terser';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      // Proxy API requests to local Supabase Edge Functions during development
      '/api': {
        target: 'http://localhost:54321',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/functions/v1'),
      }
    }
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
    // In production, use terser to remove all console.* calls
    mode === 'production' && 
    terser({
      compress: {
        drop_console: true,
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
