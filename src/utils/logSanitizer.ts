
/**
 * Re-export from the consolidated sanitization module for backward compatibility
 */
import { sanitizeErrorMessage, safeConsoleError, sanitizeAllArgs, handleAuthError } from './sanitization';

export {
  sanitizeErrorMessage,
  safeConsoleError,
  sanitizeAllArgs,
  handleAuthError
};
