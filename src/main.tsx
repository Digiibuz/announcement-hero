
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializeSecureClient } from './integrations/supabase/client.ts'
import { toast } from 'sonner'

// Initialiser le client Supabase de manière sécurisée avant le rendu de l'application
const init = async () => {
  try {
    console.log("Démarrage de l'initialisation de Supabase...");
    // Tenter d'initialiser le client Supabase
    const success = await initializeSecureClient();
    
    if (!success) {
      console.warn("Échec de l'initialisation de Supabase. Certaines fonctionnalités peuvent ne pas fonctionner correctement.");
      toast.error("Problème de connexion avec le serveur", {
        description: "Certaines fonctionnalités peuvent être limitées"
      });
    } else {
      console.log("Client Supabase initialisé avec succès");
    }
  } catch (error) {
    console.error("Erreur lors de l'initialisation:", error);
    toast.error("Erreur de connexion au serveur", {
      description: "Veuillez rafraîchir la page ou réessayer plus tard"
    });
  } finally {
    // Rendre l'application même en cas d'échec pour permettre au moins l'affichage de l'interface
    console.log("Rendu de l'application...");
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    )
  }
}

// Démarrer l'initialisation avec gestion d'erreur
try {
  init();
} catch (e) {
  console.error("Erreur fatale lors de l'initialisation:", e);
  // Fallback pour au moins afficher quelque chose en cas d'erreur critique
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}
