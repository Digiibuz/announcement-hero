
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initConsoleOverrides } from './utils/consoleOverride.ts'

// Initialiser la sécurisation des logs console
initConsoleOverrides();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
