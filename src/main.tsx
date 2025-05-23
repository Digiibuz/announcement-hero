
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Configuration simplifiée pour éviter les rechargements complets
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

// Fonction simple pour vider le cache si nécessaire
declare global {
  interface Window {
    clearCacheAndReload: () => void;
    queryClient?: any;
  }
}

window.clearCacheAndReload = () => {
  window.location.reload();
};

// Utiliser createRoot pour éviter le double rendu
const root = createRoot(document.getElementById("root")!);
root.render(<App />);
