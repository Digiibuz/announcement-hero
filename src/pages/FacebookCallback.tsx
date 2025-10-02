import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const FacebookCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        toast.error('Erreur lors de la connexion à Facebook');
        navigate('/profile');
        return;
      }

      if (!code || !user?.id) {
        toast.error('Code d\'autorisation manquant');
        navigate('/profile');
        return;
      }

      try {
        const { data, error: functionError } = await supabase.functions.invoke('facebook-oauth', {
          body: { code, userId: user.id },
        });

        if (functionError) throw functionError;

        if (data?.success) {
          toast.success('Page(s) Facebook connectée(s) avec succès !');
          navigate('/profile');
        } else {
          throw new Error('Failed to connect Facebook');
        }
      } catch (error) {
        console.error('Error handling Facebook callback:', error);
        toast.error('Erreur lors de la connexion à Facebook');
        navigate('/profile');
      }
    };

    handleCallback();
  }, [searchParams, navigate, user]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg">Connexion à Facebook en cours...</p>
      </div>
    </div>
  );
};

export default FacebookCallback;
