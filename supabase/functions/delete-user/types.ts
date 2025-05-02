
/**
 * Types for the delete-user function
 */

export interface RequestData {
  userId: string;
}

export interface DeleteUserResponse {
  success: boolean;
  error?: string;
  details?: string;
}
