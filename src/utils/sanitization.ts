/**
 * Combined utilities for sanitizing logs, URLs, and sensitive information
 */
import { PROTOCOLS, HTTP_METHODS, SENSITIVE_PATTERNS, SENSITIVE_KEYWORDS, getSensitiveDomains, getSecureAuthErrorMessage } from './sensitiveDataPatterns';

// Constants
const FAKE_URL = 'https://api-secure.example.com/auth';

/**
 * Masks all URLs in a text, including HTTP requests
 */
export function maskAllUrls(text: string): string {
  if (!text) return text;
  
  // Mask all HTTP requests (METHOD URL) with priority
  HTTP_METHODS.forEach(method => {
    const methodRegex = new RegExp(`${method}\\s+https?:\\/\\/[^\\s]+`, 'gi');
    text = text.replace(methodRegex, `${method} [URL_MASKED]`);
  });
  
  // Mask specific sensitive POST requests
  text = text.replace(/POST https?:\/\/[^\s]*supabase[^\s]*/gi, "POST [URL_MASKED]");
  text = text.replace(/POST https?:\/\/[^\s]*auth\/v1\/token[^\s]*/gi, "POST [URL_MASKED]");
  text = text.replace(/POST https?:\/\/[^\s]*token\?grant[^\s]*/gi, "POST [URL_MASKED]");
  text = text.replace(/POST https?:\/\/[^\s]*grant_type=password[^\s]*/gi, "POST [URL_MASKED]");
  
  // For each protocol, mask all URLs
  PROTOCOLS.forEach(protocol => {
    let startIndex = text.indexOf(protocol);
    while (startIndex !== -1) {
      // Find the end of the URL
      let endIndex = text.indexOf(' ', startIndex);
      if (endIndex === -1) endIndex = text.indexOf('"', startIndex);
      if (endIndex === -1) endIndex = text.indexOf("'", startIndex);
      if (endIndex === -1) endIndex = text.indexOf(')', startIndex);
      if (endIndex === -1) endIndex = text.indexOf('}', startIndex);
      if (endIndex === -1) endIndex = text.indexOf(']', startIndex);
      if (endIndex === -1) endIndex = text.length;
      
      // Extract the URL
      const url = text.substring(startIndex, endIndex);
      
      // Replace with a masked version
      text = text.replace(url, '[URL_MASKED]');
      
      // Find the next occurrence
      startIndex = text.indexOf(protocol, startIndex + 1);
    }
  });
  
  return text;
}

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
 * Masks sensitive parameters in URLs
 */
export function maskSensitiveUrlParams(url: string): string {
  try {
    if (!url) return "[EMPTY_URL]";
    
    // Completely mask the URL if it contains sensitive keywords
    for (const keyword of SENSITIVE_KEYWORDS) {
      if (url.toLowerCase().includes(keyword.toLowerCase())) {
        return "[MASKED_SENSITIVE_URL]";
      }
    }
    
    // Otherwise try to parse the URL to mask only sensitive parameters
    const urlObj = new URL(url);
    
    // Mask the path if it contains sensitive segments
    if (SENSITIVE_KEYWORDS.some(keyword => urlObj.pathname.toLowerCase().includes(keyword.toLowerCase()))) {
      urlObj.pathname = "/[MASKED_PATH]";
    }
    
    // Mask all query parameters
    if (urlObj.search) {
      urlObj.search = "?[MASKED_PARAMETERS]";
    }
    
    // Mask the hash
    if (urlObj.hash) {
      urlObj.hash = "#[MASKED_HASH]";
    }
    
    return urlObj.toString();
  } catch (e) {
    // In case of parsing error, completely mask the URL
    return "[MASKED_URL]";
  }
}

/**
 * Replaces all sensitive URLs in a string
 */
export function replaceAllSensitiveUrls(str: string): string {
  if (!str) return str;
  
  let result = str;
  
  // List of sensitive URLs to replace
  const SENSITIVE_URLS = [
    'supabase.co',
    'auth/v1/token',
    'token?grant_type=password',
    'grant_type=password',
    'rdwqedmvzicerwotjseg'
  ];
  
  // Replace all sensitive HTTP(S) URLs
  for (const sensitiveUrl of SENSITIVE_URLS) {
    // Complete URL with protocol
    const httpRegex = new RegExp(`https?://[^\\s"']*${sensitiveUrl}[^\\s"']*`, 'gi');
    result = result.replace(httpRegex, FAKE_URL);
    
    // URL part without protocol
    const partRegex = new RegExp(`[^\\s"'/]*${sensitiveUrl}[^\\s"']*`, 'gi');
    result = result.replace(partRegex, 'api-secure.example.com');
  }
  
  // Replace HTTP requests with method
  const methodRegex = /(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s+https?:\/\/[^\s"']*/gi;
  result = result.replace(methodRegex, '$1 ' + FAKE_URL);
  
  // Replace HTTP error codes
  result = result.replace(/400\s*\(Bad Request\)/gi, '[HTTP_ERROR]');
  result = result.replace(/401\s*\(Unauthorized\)/gi, '[HTTP_ERROR]');
  
  // Replace references to minified JS files
  result = result.replace(/index-[a-zA-Z0-9_-]+\.js/gi, 'app.js');
  
  return result;
}

/**
 * Safe wrapper for console.error that masks sensitive information
 */
export function safeConsoleError(message: string, ...args: any[]): void {
  // Mask the main message
  const sanitizedMessage = sanitizeErrorMessage(message);
  
  // Mask arguments that might contain sensitive information
  const sanitizedArgs = args.map(arg => {
    if (typeof arg === 'string') {
      return sanitizeErrorMessage(arg);
    } else if (typeof arg === 'object' && arg !== null) {
      try {
        // Try to mask sensitive information in JSON objects
        const jsonString = JSON.stringify(arg);
        const sanitizedJson = sanitizeErrorMessage(jsonString);
        return JSON.parse(sanitizedJson);
      } catch {
        // On failure, return a generic object
        return {"message": "Object masked for security reasons"};
      }
    }
    return arg;
  });
  
  // Use console.error directly to avoid infinite loops
  console.error(sanitizedMessage, ...sanitizedArgs);
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

/**
 * Handles authentication errors securely
 */
export function handleAuthError(error: any): string {
  // Never log the original error, return a generic message
  return "Invalid credentials. Please check your email and password.";
}
