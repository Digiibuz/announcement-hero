
/**
 * Main entry point for console enhancements and security measures
 */
import { setupGlobalListeners } from './globalListeners';
import { 
  setupConsoleOverrides,
  initializeConsoleSecurity,
  SENSITIVE_PATTERNS 
} from './consoleOverrides';
import { logAuthError } from '../authErrorHandler';

/**
 * Initialize all console overrides and security measures
 */
export function initConsoleOverrides(): void {
  // Initialize console security features
  setupConsoleOverrides();
  
  // Set up global error listeners
  setupGlobalListeners();
  
  // Log initialization completed with sanitized output
  console.log('Console security initialized');
}

/**
 * Test function to verify that sensitive logs are properly sanitized
 * Only used in development
 */
export function testSecureLogs(): void {
  try {
    console.log('Testing secure logs...');
    
    // Attempt to log sensitive data that should be sanitized
    const sensitiveUrl = 'https://rdwqedmvzicerwotjseg.supabase.co/auth/v1/token?grant_type=password';
    console.log('Sensitive URL test:', sensitiveUrl);
    
    // Simulate an error with sensitive data
    const sensitiveError = new Error('Failed to fetch from https://rdwqedmvzicerwotjseg.supabase.co/auth/v1/token');
    console.error('Sensitive error test:', sensitiveError);
    
    // Log completion
    console.log('Secure logs test completed');
  } catch (err) {
    // Use our new centralized auth error logger
    logAuthError(err, 'SecureLogTest');
  }
}

// Re-export everything for other modules
export { 
  SENSITIVE_PATTERNS, 
  initializeConsoleSecurity,
  setupConsoleOverrides as overrideConsoleFunctions,
};

// Export the function but under the original name for backward compatibility
export { setupConsoleOverrides } from './consoleOverrides';

