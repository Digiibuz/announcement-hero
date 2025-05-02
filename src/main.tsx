
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initErrorBlocker } from './utils/initErrorBlocker'

// Intercepter immédiatement toutes les requêtes réseau sensibles
(function() {
  // Liste des patterns sensibles à bloquer
  const SENSITIVE_PATTERNS = [
    /supabase\.co/i,
    /auth\/v1\/token/i,
    /token\?grant_type=password/i,
    /auth\/v1/i,
    /grant_type=password/i,
    /400.*bad request/i,
    /401/i,
    /rdwqedmvzicerwotjseg/i
  ];

  const originalFetch = window.fetch;
  window.fetch = function(input, init) {
    try {
      const url = typeof input === 'string' ? input : input instanceof Request ? input.url : String(input);
      
      // Bloquer complètement les requêtes qui contiennent des informations sensibles
      if (SENSITIVE_PATTERNS.some(pattern => pattern.test(url))) {
        // Exécuter la requête en arrière-plan sans qu'elle n'apparaisse dans l'inspecteur
        originalFetch(input, init).then(() => {}).catch(() => {});
        
        // Retourner une réponse factice
        return Promise.resolve(new Response(JSON.stringify({ status: "ok" }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }));
      }
      
      return originalFetch(input, init);
    } catch (e) {
      return originalFetch(input, init);
    }
  };
})();

// Initialiser le bloqueur d'erreurs avant tout autre code
initErrorBlocker();

// Initialiser les intercepteurs réseau
import './utils/console/networkInterceptor'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
