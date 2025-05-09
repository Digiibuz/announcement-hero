
// This file re-exports the auth context from the new location to maintain backward compatibility
import { AuthProvider, useAuth } from './auth/AuthContext';

export { AuthProvider, useAuth };
