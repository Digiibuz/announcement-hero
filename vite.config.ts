
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

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
    mode === 'development' && componentTagger(),
    // En production, utiliser un plugin minification simple au lieu de terser
    // qui cause des problèmes d'importation
    mode === 'production' && {
      name: 'remove-console',
      transform(code: string, id: string) {
        if (id.endsWith('.js') || id.endsWith('.ts') || id.endsWith('.tsx') || id.endsWith('.jsx')) {
          // Version simplifiée de ce que fait terser pour éliminer les console.*
          return code
            .replace(/console\.log\s*\([^)]*\)\s*;?/g, '')
            .replace(/console\.error\s*\([^)]*\)\s*;?/g, '')
            .replace(/console\.warn\s*\([^)]*\)\s*;?/g, '');
        }
        return code;
      }
    }
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
