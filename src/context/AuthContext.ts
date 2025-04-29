
// Re-export all auth functionality from the new structure
// This file helps with backward compatibility during refactoring
export { AuthProvider, useAuth } from './auth';
export type { AuthContextType } from './auth';
export { hasRole } from './auth';
export type { Role } from './auth';
