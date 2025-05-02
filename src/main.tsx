
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initErrorBlocker } from './utils/initErrorBlocker'

// Initialiser le bloqueur d'erreurs avant tout autre code
initErrorBlocker();

// Initialiser les intercepteurs réseau
import './utils/console/networkInterceptor'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
