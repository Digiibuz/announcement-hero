
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
  build: {
    // Improved chunking strategy
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: [
            'react', 
            'react-dom', 
            'react-router-dom', 
            '@tanstack/react-query',
            'next-themes',
            'sonner'
          ],
          ui: [
            '@/components/ui'
          ],
        }
      }
    },
    // Ensure index.html loads the correct script
    assetsInlineLimit: 0,
    // Improve sourcemaps for easier debugging
    sourcemap: true,
  },
}));
