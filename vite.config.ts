
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
      // Proxy les appels API vers les fonctions Edge en développement local
      '/api/auth/secure-client-config': {
        target: 'https://rdwqedmvzicerwotjseg.supabase.co/functions/v1/secure-client-config',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/auth\/secure-client-config/, '')
      }
    }
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
  // Définitions pour Deno global en builds navigateur
  define: {
    // Ajoutez ceci pour gérer le global Deno dans les builds navigateur
    "Deno": "undefined",
    
    // Protection contre l'inclusion de variables d'environnement sensibles
    // Supprime toutes les références aux variables env sensibles dans le bundle final
    'process.env.SUPABASE_URL': '"PROTECTED"',
    'process.env.SUPABASE_ANON_KEY': '"PROTECTED"',
    'process.env.VITE_SUPABASE_URL': '"PROTECTED"',
    'process.env.VITE_SUPABASE_ANON_KEY': '"PROTECTED"'
  },
  build: {
    // Enable proper sourcemap generation for development builds
    sourcemap: mode === 'development' ? 'inline' : false,
    
    // Configuration spécifique pour la production
    rollupOptions: {
      // Avertir sur les imports dynamiques qui pourraient exposer des secrets
      onwarn(warning, warn) {
        // Filtrer les avertissements pour empêcher l'inclusion de variables sensibles
        if (warning.code === 'EVAL' || 
            (warning.code === 'UNRESOLVED_IMPORT' && 
             warning.message.includes('supabase'))) {
          return;
        }
        warn(warning);
      }
    },
    // Améliorer l'obfuscation pour la production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Supprimer tous les console.log en production
        drop_debugger: true
      },
      mangle: {
        // Protection supplémentaire pour les noms sensibles
        reserved: ['supabaseUrl', 'supabaseKey', 'anonKey']
      }
    }
  }
}));
