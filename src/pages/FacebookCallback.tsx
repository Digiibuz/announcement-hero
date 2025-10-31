import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const FacebookCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('Connexion à Facebook en cours...');

  useEffect(() => {
    console.log('🔵 FacebookCallback mounted');
    console.log('🔵 URL params:', Object.fromEntries(searchParams.entries()));
    console.log('🔵 window.opener exists:', !!window.opener);
    
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      const state = searchParams.get('state');

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
      console.log('🔐 State reçu:', state ? state.substring(0, 20) + '...' : 'MANQUANT');

      // VALIDATION DU STATE (Protection CSRF)
      const expectedState = localStorage.getItem('facebook_auth_state');
      if (!state || !expectedState || state !== expectedState) {
        console.error('❌ State invalide ou manquant:', { 
          received: state?.substring(0, 20), 
          expected: expectedState?.substring(0, 20) 
        });
        localStorage.setItem('facebook_auth_error', 'invalid_state');
        setStatus('Erreur de sécurité - Veuillez réessayer');
        setTimeout(() => navigate('/profile'), 2000);
        return;
      }

      console.log('✅ State validé avec succès');

      // TOUJOURS stocker dans localStorage (partage entre fenêtres)
      localStorage.setItem('facebook_auth_code', code);
      localStorage.setItem('facebook_auth_timestamp', Date.now().toString());
      
      // Détecter si c'est une redirection mobile
      const isMobileRedirect = localStorage.getItem('facebook_auth_redirect') === 'true';
      
      if (isMobileRedirect) {
        console.log('📱 Redirection mobile détectée');
        const returnUrl = localStorage.getItem('facebook_return_url') || '/profile';
        localStorage.removeItem('facebook_auth_redirect');
        localStorage.removeItem('facebook_return_url');
        setStatus('Redirection...');
        navigate(returnUrl);
        return;
      }

      // Tenter d'envoyer via postMessage (desktop normal)
      try {
        if (window.opener && !window.opener.closed) {
          console.log('🔵 Tentative postMessage vers parent');
          
          // Test d'accès à window.opener (détection 2FA)
          try {
            const test = window.opener.location.href;
            console.log('✅ window.opener accessible');
          } catch (e) {
            console.log('🔒 window.opener bloqué (2FA détecté)');
            localStorage.setItem('instagram_2fa_detected', 'true');
          }
          
          window.opener.postMessage({
            type: 'FACEBOOK_AUTH_SUCCESS',
            code: code,
            state: state // Inclure le state dans le postMessage
          }, window.location.origin);
          
          console.log('✅ postMessage envoyé');
          setStatus('Fermeture de la fenêtre...');
          setTimeout(() => {
            console.log('🔵 Fermeture de la popup');
            window.close();
          }, 1000);
          return;
        } else {
          console.log('⚠️ window.opener non disponible');
        }
      } catch (e) {
        console.error('❌ Erreur postMessage:', e);
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
      <div className="text-center space-y-4 p-8">
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
        <p className="text-lg text-foreground">{status}</p>
      </div>
    </div>
  );
};

export default FacebookCallback;
