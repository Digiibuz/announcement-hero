
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initConsoleOverrides, testSecureLogs } from './utils/console'

// Initialiser la sécurisation des logs console AVANT tout autre code
initConsoleOverrides();

// Tester la sécurisation des logs pour vérifier que tout fonctionne
// Ne pas utiliser en production
if (process.env.NODE_ENV === 'development') {
  testSecureLogs();
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
