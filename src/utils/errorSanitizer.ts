
/**
 * Utilities for sanitizing error messages and sensitive information
 */
import { SENSITIVE_PATTERNS, SENSITIVE_KEYWORDS, getSensitiveDomains } from './sensitiveDataPatterns';
import { maskAllUrls } from './urlSanitizer';

/**
 * Masks sensitive URLs in an error message
 */
export function sanitizeErrorMessage(message: string): string {
  if (!message) return "Unknown error";
  
  let sanitizedMessage = message;
  
  try {
    // Special protection for JSON objects
    if (typeof message === 'object') {
      try {
        sanitizedMessage = JSON.stringify(message);
      } catch (e) {
        return "Complex error object (details masked)";
      }
    }
    
    // COMPLETELY block specific authentication error messages
    if (sanitizedMessage.includes("token?grant_type=password") || 
        sanitizedMessage.includes("/auth/v1/token") || 
        sanitizedMessage.includes("401") || 
        sanitizedMessage.includes("400") || 
        sanitizedMessage.includes("grant_type=password") ||
        sanitizedMessage.includes("Bad Request") ||
        sanitizedMessage.includes("rdwqedmvzicerwotjseg") ||
        sanitizedMessage.includes("Invalid login credentials")) {
      return "[AUTHENTICATION_ERROR]";
    }
    
    // Apply maskAllUrls for a first level of protection
    sanitizedMessage = maskAllUrls(sanitizedMessage);
    
    // Apply sensitive masking patterns
    SENSITIVE_PATTERNS.forEach(pattern => {
      sanitizedMessage = sanitizedMessage.replace(pattern, "[SENSITIVE_INFORMATION_MASKED]");
    });
    
    // Mask URLs of sensitive domains
    getSensitiveDomains().forEach(domain => {
      // Use stricter regex to find all occurrences of the sensitive domain
      const regex = new RegExp(`https?://[a-zA-Z0-9-_.]*${domain}[a-zA-Z0-9-_.:/]*`, 'gi');
      sanitizedMessage = sanitizedMessage.replace(regex, "[MASKED_DOMAIN]");
      
      // Mask the domain name without protocol as well
      const domainRegex = new RegExp(`[a-zA-Z0-9-_.]*${domain}[a-zA-Z0-9-_.:/]*`, 'gi');
      sanitizedMessage = sanitizedMessage.replace(domainRegex, "[MASKED_DOMAIN]");
    });
    
    // Mask URLs containing sensitive keywords
    SENSITIVE_KEYWORDS.forEach(keyword => {
      const regex = new RegExp(`https?://[^\\s]*${keyword}[^\\s]*`, 'gi');
      sanitizedMessage = sanitizedMessage.replace(regex, `[MASKED_SENSITIVE_URL]`);
      
      // Mask URL paths containing the keyword
      const pathRegex = new RegExp(`\/${keyword}[^\\s"',)]*`, 'gi');
      sanitizedMessage = sanitizedMessage.replace(pathRegex, `/[MASKED_SENSITIVE_PATH]`);
    });
    
    // Mask any address with supabase.co, even partial
    sanitizedMessage = sanitizedMessage.replace(/[a-z0-9-_]+\.supabase\.co/gi, "[MASKED_PROJECT].supabase.co");
    
    // Specifically mask HTTP requests containing supabase URLs
    HTTP_METHODS.forEach(method => {
      sanitizedMessage = sanitizedMessage.replace(
        new RegExp(`${method}\\s+https?:\\/\\/[^\\s]*supabase[^\\s]*`, 'gi'), 
        `${method} [MASKED_SUPABASE_URL]`
      );
    });
    
    // Mask preview prefixes
    sanitizedMessage = sanitizedMessage.replace(/preview-[a-z0-9-]+/gi, "preview-[MASKED_ID]");
    
    // Mask authentication error messages that might reveal information
    sanitizedMessage = sanitizedMessage.replace(/(AuthApiError|AuthError)[^\n]*/gi, "Authentication error (details masked)");
    
    // Mask login errors with credentials
    sanitizedMessage = sanitizedMessage.replace(/invalid[_\s]credentials/gi, "[AUTHENTICATION_ERROR]");
    sanitizedMessage = sanitizedMessage.replace(/Invalid login credentials/gi, "[AUTHENTICATION_ERROR]");
    
    // Mask authentication errors in French
    sanitizedMessage = sanitizedMessage.replace(/Erreur d['']authentification/gi, "[AUTHENTICATION_ERROR]");
    sanitizedMessage = sanitizedMessage.replace(/Erreur d'authentification sécurisée/gi, "[AUTHENTICATION_ERROR]");
    sanitizedMessage = sanitizedMessage.replace(/\[ERREUR_AUTHENTIFICATION\]/gi, "[AUTHENTICATION_ERROR]");
    
    // Mask HTTP status codes and responses
    sanitizedMessage = sanitizedMessage.replace(/\d{3} \(Bad Request\)/gi, "[STATUS_CODE]");
    sanitizedMessage = sanitizedMessage.replace(/\d{3} \(Unauthorized\)/gi, "[STATUS_CODE]");
    
    // Mask specific error messages in French
    sanitizedMessage = sanitizedMessage.replace(/identifiants invalides/gi, "[AUTHENTICATION_ERROR]");
    
    // Mask anything that might look like a domain name
    sanitizedMessage = sanitizedMessage.replace(/index-[a-zA-Z0-9]+/gi, "[MASKED_INDEX]");
    
  } catch (e) {
    // In case of error in masking, return a generic message
    return "Unknown error (details masked for security)";
  }
  
  return sanitizedMessage;
}

/**
 * Handles authentication errors securely
 */
export function handleAuthError(error: any): string {
  // Never log the original error, return a generic message
  return "Invalid credentials. Please check your email and password.";
}

/**
 * Utility function to sanitize all types of arguments
 */
export function sanitizeAllArgs(args: any[]): any[] {
  return args.map(arg => {
    if (typeof arg === 'string') {
      return sanitizeErrorMessage(arg);
    } else if (arg instanceof Error) {
      // For Error objects, mask the message, name and stack trace
      const sanitizedError = new Error(sanitizeErrorMessage(arg.message));
      sanitizedError.name = arg.name;
      sanitizedError.stack = arg.stack ? sanitizeErrorMessage(arg.stack) : undefined;
      return sanitizedError;
    } else if (typeof arg === 'object' && arg !== null) {
      try {
        // Specifically handle Response objects
        if (arg instanceof Response) {
          return {
            status: arg.status,
            statusText: arg.statusText,
            url: sanitizeErrorMessage(arg.url || '')
          };
        }
        
        // For other objects, try to convert to JSON, mask, then convert back
        const jsonStr = JSON.stringify(arg);
        const sanitizedJson = sanitizeErrorMessage(jsonStr);
        return JSON.parse(sanitizedJson);
      } catch {
        // If it fails, return a generic object
        return { info: "Object masked for security reasons" };
      }
    }
    return arg;
  });
}
