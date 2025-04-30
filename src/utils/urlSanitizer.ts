
/**
 * Re-export from the consolidated sanitization module for backward compatibility
 */
import { maskAllUrls, maskSensitiveUrlParams, replaceAllSensitiveUrls } from './sanitization';

export {
  maskAllUrls,
  maskSensitiveUrlParams,
  replaceAllSensitiveUrls
};
