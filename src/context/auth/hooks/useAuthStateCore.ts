
import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { setSupabaseClient } from '@/integrations/supabase/client';
import { UserProfile } from '@/types/auth';
import { createProfileFromMetadata } from '@/hooks/useUserProfile';
import { useSupabaseConfig } from '@/context/SupabaseConfigContext';
import { hasRole } from '../types';
import { usePersistedState } from '@/hooks/usePersistedState';
import { silenceAllErrors } from './authSecurityUtils';

export const useAuthStateCore = () => {
  const [user, setUser] = usePersistedState<UserProfile | null>("auth_user", null);
  const [session, setSession] = usePersistedState<Session | null>("auth_session", null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const location = useLocation();
  const navigate = useNavigate();
  const [isOnResetPasswordPage, setIsOnResetPasswordPage] = usePersistedState(
    "auth_is_on_reset_password_page",
    location.pathname.includes('reset-password')
  );

  // Access Supabase client via context
  const { client: supabase, isLoading: isConfigLoading, error: configError } = useSupabaseConfig();

  // Update Supabase singleton when client is ready
  useEffect(() => {
    if (supabase) {
      setSupabaseClient(supabase);
    }
  }, [supabase]);

  // Derive authentication states
  const isAdmin = useMemo(() => hasRole(user, 'admin'), [user]);
  const isClient = useMemo(() => hasRole(user, 'client'), [user]);
  const isAuthenticated = useMemo(() => !!user && !!session, [user, session]);

  // Update reset password page state when location changes
  useEffect(() => {
    setIsOnResetPasswordPage(location.pathname.includes('reset-password'));
  }, [location.pathname, setIsOnResetPasswordPage]);

  return {
    user,
    setUser,
    session,
    setSession,
    isLoading,
    setIsLoading,
    navigate,
    isOnResetPasswordPage,
    setIsOnResetPasswordPage,
    supabase,
    isConfigLoading,
    configError,
    isAdmin,
    isClient,
    isAuthenticated,
    silenceAllErrors
  };
};
