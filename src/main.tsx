
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializeApp } from './utils/app-initialization';

// Initialize application features (service worker, network monitoring, etc.)
initializeApp();

// Use createRoot to avoid double rendering
const root = createRoot(document.getElementById("root")!);
root.render(<App />);
