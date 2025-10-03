import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const FacebookCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('Connexion à Facebook en cours...');

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        console.error('❌ Erreur OAuth Facebook:', error);
        localStorage.setItem('facebook_auth_error', error);
        setStatus('Erreur lors de la connexion');
        setTimeout(() => navigate('/profile'), 2000);
        return;
      }

      if (!code) {
        console.error('❌ Code d\'autorisation manquant');
        localStorage.setItem('facebook_auth_error', 'no_code');
        setStatus('Code d\'autorisation manquant');
        setTimeout(() => navigate('/profile'), 2000);
        return;
      }

      console.log('✅ Code d\'autorisation reçu:', code.substring(0, 20) + '...');

      // TOUJOURS stocker dans localStorage (partage entre fenêtres)
      localStorage.setItem('facebook_auth_code', code);
      localStorage.setItem('facebook_auth_timestamp', Date.now().toString());
      
      // Détecter si c'est une redirection mobile
      const isMobileRedirect = localStorage.getItem('facebook_auth_redirect') === 'true';
      
      if (isMobileRedirect) {
        console.log('📱 Redirection mobile détectée');
        localStorage.removeItem('facebook_auth_redirect');
        setStatus('Redirection...');
        navigate('/profile');
        return;
      }

      // Tenter d'envoyer via postMessage (desktop normal)
      try {
        if (window.opener && !window.opener.closed) {
          console.log('🔵 Tentative postMessage vers parent');
          window.opener.postMessage({
            type: 'FACEBOOK_AUTH_SUCCESS',
            code: code
          }, window.location.origin);
          
          setStatus('Fermeture de la fenêtre...');
          setTimeout(() => window.close(), 1000);
          return;
        }
      } catch (e) {
        // 2FA Instagram ou autre problème Same-Origin
        console.log('🔒 2FA détecté - window.opener bloqué, utilisation localStorage');
        localStorage.setItem('instagram_2fa_detected', 'true');
      }

      // Si on arrive ici, c'est que postMessage a échoué
      // Le parent récupérera via polling localStorage
      setStatus('Authentification réussie, redirection...');
      setTimeout(() => {
        window.close();
        // Si la fenêtre ne se ferme pas (bloqué), rediriger
        navigate('/profile');
      }, 2000);
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
        <p className="text-lg text-foreground">{status}</p>
      </div>
    </div>
  );
};

export default FacebookCallback;
