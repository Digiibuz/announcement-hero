
// Shared CORS headers for Edge Functions - Enhanced version with all necessary headers
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, range, x-web-security, x-retry-attempt, x-client-id, cache-control, pragma, x-forwarded-for, user-agent, x-real-ip, referer, *',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE, PATCH',
  'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Content-Type, Cache-Control, *',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400'
};
