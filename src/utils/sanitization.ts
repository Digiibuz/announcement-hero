
/**
 * Combined utilities for sanitizing logs, URLs, and sensitive information
 * This file re-exports functions from the more focused modules
 */

// Re-export from URL sanitizer module
export { 
  maskAllUrls,
  maskSensitiveUrlParams,
  replaceAllSensitiveUrls 
} from './urlSanitizer';

// Re-export from error sanitizer module
export {
  sanitizeErrorMessage,
  handleAuthError,
  sanitizeAllArgs
} from './errorSanitizer';

// Re-export from console sanitizer module  
export {
  safeConsoleError,
  containsSensitiveInfo,
  createSafeConsoleFunction
} from './consoleSanitizer';

// Re-export from sensitive patterns module
export {
  SENSITIVE_PATTERNS,
  SENSITIVE_KEYWORDS,
  HTTP_METHODS,
  PROTOCOLS,
  getSensitiveDomains,
  getSecureAuthErrorMessage
} from './sensitiveDataPatterns';
