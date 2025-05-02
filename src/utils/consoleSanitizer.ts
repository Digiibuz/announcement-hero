
/**
 * Utilities for safely logging to console while protecting sensitive information
 */
import { sanitizeErrorMessage, sanitizeAllArgs } from './errorSanitizer';
import { SENSITIVE_PATTERNS } from './sensitiveDataPatterns';

/**
 * Safe wrapper for console.error that masks sensitive information
 */
export function safeConsoleError(message: string, ...args: any[]): void {
  // Mask the main message
  const sanitizedMessage = sanitizeErrorMessage(message);
  
  // Mask arguments that might contain sensitive information
  const sanitizedArgs = sanitizeAllArgs(args);
  
  // Use console.error directly to avoid infinite loops
  console.error(sanitizedMessage, ...sanitizedArgs);
}

/**
 * Determines if any arguments contain sensitive information
 */
export function containsSensitiveInfo(args: any[]): boolean {
  if (!args || args.length === 0) return false;
  
  return args.some(arg => {
    if (arg === undefined || arg === null) return false;
    const str = String(arg);
    return SENSITIVE_PATTERNS.some(pattern => pattern.test(str));
  });
}

/**
 * Creates a safe wrapper around console methods
 */
export function createSafeConsoleFunction(
  originalFn: (...args: any[]) => void
): (...args: any[]) => void {
  return function(...args) {
    if (containsSensitiveInfo(args)) {
      return; // Drop the message completely
    }
    
    // For other messages, sanitize arguments
    const sanitizedArgs = sanitizeAllArgs(args);
    originalFn.apply(console, sanitizedArgs);
  };
}
