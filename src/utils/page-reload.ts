
// Page reload management utilities

// Variables for reload control
let lastReloadTime = 0;
let reloadCounter = 0;
let reloadBlockedUntil = 0; // Timestamp until which reloads are blocked
let reloadInProgress = false;
let lastVisibilityChange = 0;
let visibilityChangeCount = 0;
let justHandledVisibilityChange = false;
let visibilityChangeTimer: number | null = null;

// Function to determine if reload should be prevented for current page
export const shouldPreventReload = (): boolean => {
  const currentPath = window.location.pathname;
  
  // List of pages where automatic reload is disabled
  const noReloadPaths = [
    '/create', // Announcement creation page
    '/edit',   // Announcement edit page
    '/submit', // Form submission page
  ];
  
  // Check if current path exactly matches or starts with one of the protected paths
  for (const path of noReloadPaths) {
    if (currentPath === path || currentPath.startsWith(path + '/')) {
      console.log(`Reload protection activated for page: ${currentPath}`);
      return true;
    }
  }
  
  return false;
};

// Detect reload loops
export const isReloadLooping = (): boolean => {
  const now = Date.now();
  
  // If reload is blocked until a certain time
  if (now < reloadBlockedUntil) {
    console.log(`Reloads blocked for another ${Math.round((reloadBlockedUntil - now)/1000)}s`);
    return true;
  }
  
  // If multiple reloads in less than 3 seconds, consider it a loop
  if (now - lastReloadTime < 3000) {
    reloadCounter++;
    if (reloadCounter > 2) {
      console.log('Reload loop detected, reloads blocked for 30 seconds');
      reloadBlockedUntil = now + (30 * 1000); // Block for 30 seconds
      return true;
    }
  } else {
    // Reset counter if more than 3 seconds have passed
    reloadCounter = 0;
  }
  
  lastReloadTime = now;
  return false;
};

// Handle visibility change
export const setupVisibilityChangeHandler = (): void => {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      // Avoid multiple handling of visibility changes
      if (justHandledVisibilityChange) {
        console.log('Recent visibility change already handled, ignored');
        return;
      }
      
      justHandledVisibilityChange = true;
      
      // Reset after a delay
      if (visibilityChangeTimer) {
        clearTimeout(visibilityChangeTimer);
      }
      
      visibilityChangeTimer = window.setTimeout(() => {
        justHandledVisibilityChange = false;
      }, 1000);
      
      // User has returned to the application
      if (window.updateServiceWorker) {
        window.updateServiceWorker();
      }
      if (window.checkNetworkStatus) {
        window.checkNetworkStatus();
      }
      
      // Anti-loop: check if we have many visibility changes in a short time
      const now = Date.now();
      if (now - lastVisibilityChange < 1000) {
        visibilityChangeCount++;
      } else {
        visibilityChangeCount = 0;
      }
      lastVisibilityChange = now;
      
      // If too many rapid changes, indicates a loop
      if (visibilityChangeCount > 3) {
        console.log('Rapid visibility changes detected, possible loop - canceling reload');
        visibilityChangeCount = 0;
        return;
      }
      
      // DO NOT reload the page if on a sensitive page
      if (shouldPreventReload()) {
        console.log('Reload cancelled for sensitive page: ' + window.location.pathname);
        return;
      }
      
      // Loop detection
      if (isReloadLooping()) {
        return;
      }
      
      // Check only for login page or other pages requiring reload
      const currentPath = window.location.pathname;
      const isLoginPage = currentPath.includes('login');
      
      if (isLoginPage && !reloadInProgress) {
        console.log('Login page detected on resume, checking cache...');
        // Wait a moment before checking for problems
        setTimeout(() => {
          // If page is empty or incomplete, try to reload it
          if (document.body.children.length < 2) {
            console.log('Incomplete page detected, reloading...');
            reloadInProgress = true;
            if (window.clearCacheAndReload) {
              window.clearCacheAndReload();
            }
            // Reset flag after a delay
            setTimeout(() => {
              reloadInProgress = false;
            }, 5000);
          }
        }, 1000);
      }
    }
  });
};
