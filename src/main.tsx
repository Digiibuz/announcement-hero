
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializeSecureClient } from './integrations/supabase/client.ts'

// Initialiser le client Supabase de manière sécurisée avant le rendu de l'application
initializeSecureClient().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
})
