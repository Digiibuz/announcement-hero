
/**
 * Logging utilities for the create-user function
 */

const PREFIX = "[create-user]";

export const logger = {
  log: (message: string, ...args: any[]) => {
    console.log(`${PREFIX} ${message}`, ...args);
  },
  error: (message: string, ...args: any[]) => {
    console.error(`${PREFIX} ${message}`, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(`${PREFIX} ${message}`, ...args);
  },
  info: (message: string, ...args: any[]) => {
    console.log(`${PREFIX} ${message}`, ...args);
  }
};
