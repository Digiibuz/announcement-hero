import { Session } from "@supabase/supabase-js";

/**
 * Utility to extract token information from URL fragments for debugging
 */
export const extractTokenInfoFromUrl = () => {
  // Parse hash fragments
  const hash = window.location.hash;
  const hashParams: Record<string, string> = {};
  
  if (hash && hash.length > 1) {
    hash.substring(1).split('&').forEach(item => {
      const [key, value] = item.split('=');
      if (key && value) {
        hashParams[key] = decodeURIComponent(value);
      }
    });
  }
  
  // Parse query parameters
  const query = window.location.search;
  const queryParams: Record<string, string> = {};
  
  if (query && query.length > 1) {
    const searchParams = new URLSearchParams(query);
    for (const [key, value] of searchParams.entries()) {
      queryParams[key] = value;
    }
  }
  
  // Check for various auth parameters
  const hasAccessToken = 'access_token' in hashParams;
  const hasRefreshToken = 'refresh_token' in hashParams;
  const hasAuthCode = 'code' in queryParams;
  const hasErrorInHash = 'error' in hashParams;
  const hasErrorInQuery = 'error' in queryParams;
  
  // Collect any error information
  const errorInfo = {
    errorSource: hasErrorInHash ? 'hash' : (hasErrorInQuery ? 'query' : null),
    errorCode: hasErrorInHash ? hashParams.error : (hasErrorInQuery ? queryParams.error : null),
    errorDescription: hasErrorInHash ? (hashParams.error_description || null) : 
                     (hasErrorInQuery ? (queryParams.error_description || null) : null)
  };
  
  // Expiration information
  let expiresAt = null;
  if (hasAccessToken && hashParams.expires_in) {
    const expiresIn = parseInt(hashParams.expires_in, 10);
    if (!isNaN(expiresIn)) {
      expiresAt = new Date(Date.now() + expiresIn * 1000);
    }
  }
  
  return {
    hasAccessToken,
    hasRefreshToken,
    hasAuthCode,
    hasError: hasErrorInHash || hasErrorInQuery,
    isAuthCallback: hasAccessToken || hasRefreshToken || hasAuthCode || hasErrorInHash || hasErrorInQuery,
    tokenInfo: {
      accessToken: hasAccessToken ? hashParams.access_token : null,
      refreshToken: hasRefreshToken ? hashParams.refresh_token : null,
      tokenType: hasAccessToken ? (hashParams.token_type || null) : null,
      expiresIn: hasAccessToken ? (hashParams.expires_in || null) : null,
      expiresAt: expiresAt ? expiresAt.toISOString() : null,
      provider: hasAccessToken ? (hashParams.provider || null) : null
    },
    errorInfo,
    rawHashParams: hashParams,
    rawQueryParams: queryParams
  };
};

/**
 * Debug session information
 */
export const debugSessionInfo = (session: Session | null) => {
  if (!session) {
    console.log('DEBUG: No session available');
    return {
      exists: false,
      userId: null,
      validUntil: null,
      tokenInfo: null
    };
  }
  
  // Get important information for debugging
  const userId = session.user?.id;
  const email = session.user?.email;
  const expiresAt = new Date(session.expires_at! * 1000);
  const isExpired = expiresAt < new Date();
  const accessToken = session.access_token?.substring(0, 10) + '...[truncated]';
  const refreshToken = session.refresh_token?.substring(0, 10) + '...[truncated]';
  
  const info = {
    exists: true,
    userId,
    email,
    validUntil: expiresAt.toISOString(),
    isExpired,
    tokenInfo: {
      accessTokenPreview: accessToken,
      refreshTokenPreview: refreshToken,
      expiresIn: session.expires_in
    }
  };
  
  console.log('DEBUG: Session info', info);
  return info;
};
