
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import fs from 'fs';

// Fonction simple pour crypter une chaîne (uniquement pour le build)
function encryptForBuild(str: string): string {
  if (!str) return str;
  // Version simplifiée de crypto.ts pour le build
  const CRYPTO_KEY = "D1G11BUZ_S3CUR1TY_K3Y";
  let result = '';
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i) ^ CRYPTO_KEY.charCodeAt(i % CRYPTO_KEY.length);
    result += String.fromCharCode(charCode);
  }
  return Buffer.from(result).toString('base64');
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Chemin vers le fichier client Supabase
  const supabaseClientPath = path.resolve(__dirname, './src/integrations/supabase/client.ts');
  
  // Si en mode production, crypter les valeurs Supabase
  if (mode === 'production') {
    console.log('🔐 Cryptage des clés Supabase pour la production...');
    
    try {
      // Lire le contenu du fichier
      let clientContent = fs.readFileSync(supabaseClientPath, 'utf-8');
      
      // Valeurs à crypter
      const supabaseUrl = "https://rdwqedmvzicerwotjseg.supabase.co";
      const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkd3FlZG12emljZXJ3b3Rqc2VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwNzg4MzEsImV4cCI6MjA1ODY1NDgzMX0.Ohle_vVvdoCvsObP9A_AdyM52XdzisIvHvH1D1a88zk";
      
      // Crypter les valeurs
      const encryptedUrl = encryptForBuild(supabaseUrl);
      const encryptedKey = encryptForBuild(supabaseKey);
      
      // Remplacer les valeurs dans le fichier
      clientContent = clientContent.replace(
        `let SUPABASE_URL = "${supabaseUrl}"`,
        `let SUPABASE_URL = "${encryptedUrl}"`
      );
      
      clientContent = clientContent.replace(
        `let SUPABASE_PUBLISHABLE_KEY = "${supabaseKey}"`,
        `let SUPABASE_PUBLISHABLE_KEY = "${encryptedKey}"`
      );
      
      // Écrire le contenu modifié
      fs.writeFileSync(supabaseClientPath, clientContent, 'utf-8');
      console.log('✅ Clés Supabase cryptées avec succès pour la production');
    } catch (error) {
      console.error('❌ Erreur lors du cryptage des clés Supabase:', error);
    }
  }
  
  return {
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
  };
});
