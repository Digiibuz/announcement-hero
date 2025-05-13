
/**
 * Utility function to clean up auth state from localStorage and sessionStorage
 */
export const cleanupAuthState = () => {
  console.log("Cleaning up auth state");
  
  // Remove standard auth tokens
  localStorage.removeItem('supabase.auth.token');
  
  // Remove all Supabase auth keys from localStorage
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      console.log("Removing localStorage key:", key);
      localStorage.removeItem(key);
    }
  });
  
  // Remove from sessionStorage if used
  Object.keys(sessionStorage || {}).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      console.log("Removing sessionStorage key:", key);
      sessionStorage.removeItem(key);
    }
  });
  
  // Additional cleanup for other stored values
  try {
    Object.keys(localStorage).forEach(key => {
      if (key.includes('supabase_auth_token') || 
          key.includes('supabase_data')) {
        console.log("Removing additional localStorage key:", key);
        localStorage.removeItem(key);
      }
    });
  } catch (e) {
    console.warn("Error during additional cleanup:", e);
  }
  
  console.log("Auth state cleanup completed");
};
