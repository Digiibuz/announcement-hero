
/**
 * Utilities for replacing sensitive strings in logs
 */
import { replaceAllSensitiveUrls } from '../sanitization';

export { replaceAllSensitiveUrls };

// Additional utility function specific to console modules
export function maskSensitiveData(text: string): string {
  if (!text) return text;
  return replaceAllSensitiveUrls(text);
}
