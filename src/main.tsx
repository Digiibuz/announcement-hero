
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializeSecureClient } from './integrations/supabase/client.ts'

// Initialiser le client Supabase de manière sécurisée avant le rendu de l'application
const init = async () => {
  try {
    // Tenter d'initialiser le client Supabase
    const success = await initializeSecureClient();
    
    if (!success) {
      console.warn("Échec de l'initialisation de Supabase. Certaines fonctionnalités peuvent ne pas fonctionner correctement.");
    } else {
      console.log("Client Supabase initialisé avec succès");
    }
  } catch (error) {
    console.error("Erreur lors de l'initialisation:", error);
  } finally {
    // Rendre l'application même en cas d'échec pour permettre au moins l'affichage de l'interface
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    )
  }
}

// Démarrer l'initialisation
init();
