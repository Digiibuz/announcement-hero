
// Shared CORS headers for Edge Functions - Updated with all necessary headers
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, range, x-web-security, x-retry-attempt, x-client-id, *',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
  'Access-Control-Expose-Headers': 'Content-Length, Content-Range, *',
  'Access-Control-Max-Age': '86400'
};
