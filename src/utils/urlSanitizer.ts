/**
 * Utilities for sanitizing URLs and sensitive information in URLs
 */
import { PROTOCOLS, HTTP_METHODS, SENSITIVE_PATTERNS, SENSITIVE_KEYWORDS, getSensitiveDomains } from './sensitiveDataPatterns';

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
