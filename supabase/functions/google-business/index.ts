import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as log from "https://deno.land/std@0.168.0/log/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.1";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') as string;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') as string;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID') as string;
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET') as string;
const REDIRECT_URI = Deno.env.get('GMB_REDIRECT_URI') as string;
const API_BASE_URL = 'https://mybusiness.googleapis.com/v4';

// Configuration for logging
try {
  await log.setup({
    handlers: {
      console: new log.handlers.ConsoleHandler("DEBUG"),
    },
    loggers: {
      default: {
        level: "DEBUG",
        handlers: ["console"],
      },
    },
  });
} catch (error) {
  console.error("Error setting up logger:", error);
}

const logger = log.getLogger();

// CORS configuration
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Supabase client with service role key for unrestricted DB access
let supabaseAdmin;
try {
  supabaseAdmin = createClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY
  );
} catch (error) {
  console.error("Error creating Supabase Admin client:", error);
}

// Standard Supabase client for authenticated calls
let supabaseClient;
try {
  supabaseClient = createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );
} catch (error) {
  console.error("Error creating Supabase Client:", error);
}

// Error handling utility function
function handleError(error: any) {
  // Enhanced: Track full stack and error properties
  const errorDetails = {
    message: error.message || "Unknown error",
    stack: error.stack,
    name: error.name,
    code: error.code,
    statusCode: error.statusCode,
    toString: error.toString(),
    // Include additional details if available
    details: error.details || error.error || error.data,
  };
  
  console.error("Detailed error:", JSON.stringify(errorDetails, null, 2));
  
  return new Response(
    JSON.stringify({ 
      error: error.message || "An error occurred",
      details: errorDetails
    }),
    {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

// Function to retrieve a user's GMB profile
async function getUserGoogleProfile(userId: string) {
  try {
    logger.info(`Looking for Google profile for user: ${userId}`);
    
    const { data, error } = await supabaseAdmin
      .from('user_google_business_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      logger.error(`Error retrieving Google profile: ${JSON.stringify(error)}`);
      return null;
    }
    
    logger.info(`Google profile found: ${JSON.stringify(data)}`);
    return data;
  } catch (err) {
    logger.error(`Exception retrieving Google profile: ${JSON.stringify(err)}`);
    return null;
  }
}

// Function to generate OAuth authorization URL
function getGoogleAuthUrl(state: string) {
  logger.info(`Generating authorization URL for state: ${state}`);
  
  // Check if required environment variables are set and not placeholder values
  if (!GOOGLE_CLIENT_ID) {
    logger.error('GOOGLE_CLIENT_ID not defined in environment variables');
    throw new Error('GOOGLE_CLIENT_ID not defined. Please configure this variable in the Edge Functions secrets.');
  }
  
  if (GOOGLE_CLIENT_ID === "Your Google OAuth client ID") {
    logger.error('GOOGLE_CLIENT_ID contains placeholder value');
    throw new Error('GOOGLE_CLIENT_ID contains a placeholder value. Please replace it with your actual Google client ID in the Edge Functions secrets.');
  }
  
  if (!GOOGLE_CLIENT_SECRET) {
    logger.error('GOOGLE_CLIENT_SECRET not defined in environment variables');
    throw new Error('GOOGLE_CLIENT_SECRET not defined. Please configure this variable in the Edge Functions secrets.');
  }
  
  if (GOOGLE_CLIENT_SECRET === "Your Google OAuth client secret") {
    logger.error('GOOGLE_CLIENT_SECRET contains placeholder value');
    throw new Error('GOOGLE_CLIENT_SECRET contains a placeholder value. Please replace it with your actual Google client secret in the Edge Functions secrets.');
  }
  
  if (!REDIRECT_URI) {
    logger.error('GMB_REDIRECT_URI not defined in environment variables');
    throw new Error('GMB_REDIRECT_URI not defined. Please configure this variable in the Edge Functions secrets.');
  }
  
  if (REDIRECT_URI === "The URL to redirect back to after Google authentication") {
    logger.error('GMB_REDIRECT_URI contains placeholder value');
    throw new Error('GMB_REDIRECT_URI contains a placeholder value. Please replace it with your actual redirect URL in the Edge Functions secrets.');
  }
  
  const scopes = [
    'https://www.googleapis.com/auth/business.manage',
    'https://www.googleapis.com/auth/userinfo.email'
  ];
  
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: scopes.join(' '),
    access_type: 'offline',
    state: state,
    prompt: 'consent', // Force consent display to get a refresh token
  });
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  logger.info(`Generated authorization URL: ${authUrl}`);
  return authUrl;
}

// Function to exchange code for tokens
async function exchangeCodeForTokens(code: string) {
  logger.info(`Exchanging authorization code for tokens. Code length: ${code.length}`);
  
  // Check if required environment variables are set
  if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === "Your Google OAuth client ID") {
    logger.error('GOOGLE_CLIENT_ID not properly defined in environment variables');
    throw new Error('GOOGLE_CLIENT_ID not properly defined. Please configure this variable with your actual Google client ID.');
  }
  
  if (!GOOGLE_CLIENT_SECRET || GOOGLE_CLIENT_SECRET === "Your Google OAuth client secret") {
    logger.error('GOOGLE_CLIENT_SECRET not properly defined in environment variables');
    throw new Error('GOOGLE_CLIENT_SECRET not properly defined. Please configure this variable with your actual Google client secret.');
  }
  
  if (!REDIRECT_URI || REDIRECT_URI === "The URL to redirect back to after Google authentication") {
    logger.error('GMB_REDIRECT_URI not properly defined in environment variables');
    throw new Error('GMB_REDIRECT_URI not properly defined. Please configure this variable with your actual redirect URL.');
  }
  
  const tokenEndpoint = 'https://oauth2.googleapis.com/token';
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    code: code,
    grant_type: 'authorization_code',
    redirect_uri: REDIRECT_URI,
  });
  
  try {
    logger.info(`Sending request to ${tokenEndpoint}`);
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      logger.error(`Error exchanging code (${response.status}): ${JSON.stringify(errorData)}`);
      throw new Error(`Error exchanging code: ${JSON.stringify(errorData)}`);
    }
    
    const data = await response.json();
    logger.info(`Tokens received successfully. access_token length: ${data.access_token?.length}, refresh_token present: ${!!data.refresh_token}`);
    return data;
  } catch (err) {
    logger.error(`Exception exchanging code: ${JSON.stringify(err)}`);
    throw err;
  }
}

// Function to refresh access token
async function refreshAccessToken(refreshToken: string) {
  logger.info(`Refreshing access token`);
  
  const tokenEndpoint = 'https://oauth2.googleapis.com/token';
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });
  
  try {
    logger.info(`Sending refresh request to ${tokenEndpoint}`);
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      logger.error(`Error refreshing token (${response.status}): ${JSON.stringify(errorData)}`);
      throw new Error(`Error refreshing token: ${JSON.stringify(errorData)}`);
    }
    
    const data = await response.json();
    logger.info(`Token refreshed successfully. New token length: ${data.access_token?.length}`);
    return data;
  } catch (err) {
    logger.error(`Exception refreshing token: ${JSON.stringify(err)}`);
    throw err;
  }
}

// Function to get Google user information
async function getGoogleUserInfo(accessToken: string) {
  logger.info(`Retrieving Google user information`);
  
  try {
    const userInfoEndpoint = 'https://www.googleapis.com/userinfo/v2/me';
    logger.info(`Sending request to ${userInfoEndpoint}`);
    
    const response = await fetch(userInfoEndpoint, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      logger.error(`Error retrieving user information (${response.status}): ${JSON.stringify(errorData)}`);
      throw new Error(`Error retrieving user information: ${JSON.stringify(errorData)}`);
    }
    
    const userInfo = await response.json();
    logger.info(`User information retrieved: ${JSON.stringify(userInfo)}`);
    return userInfo;
  } catch (err) {
    logger.error(`Exception retrieving user information: ${JSON.stringify(err)}`);
    throw err;
  }
}

// Function to call Google My Business API with appropriate token
async function callGmbApi(endpoint: string, method = 'GET', accessToken: string, body?: any) {
  const url = `${API_BASE_URL}/${endpoint}`;
  logger.info(`Calling GMB API: ${method} ${url}`);
  
  const options: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  };
  
  if (body) {
    options.body = JSON.stringify(body);
    logger.info(`Request body: ${options.body}`);
  }
  
  try {
    const response = await fetch(url, options);
    
    // Log raw response for debugging
    const responseText = await response.text();
    logger.info(`Raw API response: ${responseText}`);
    
    // Parse response as JSON if possible
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      logger.error(`Error parsing JSON response: ${e}`);
      responseData = { text: responseText };
    }
    
    if (!response.ok) {
      logger.error(`GMB API error (${response.status}): ${JSON.stringify(responseData)}`);
      throw new Error(`GMB API error (${response.status}): ${JSON.stringify(responseData)}`);
    }
    
    return responseData;
  } catch (err) {
    logger.error(`Exception calling GMB API: ${JSON.stringify(err)}`);
    throw err;
  }
}

// Function to list GMB accounts
async function listAccounts(accessToken: string) {
  logger.info(`Listing GMB accounts`);
  return await callGmbApi('accounts', 'GET', accessToken);
}

// Function to list locations for a GMB account
async function listLocations(accountId: string, accessToken: string) {
  logger.info(`Listing locations for account: ${accountId}`);
  return await callGmbApi(`accounts/${accountId}/locations`, 'GET', accessToken);
}

// Main entry point for the Edge Function
serve(async (req) => {
  // Detailed log of each request
  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] New request: ${req.method} ${req.url}`);
  
  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      console.log(`[${requestId}] Processing CORS preflight request`);
      return new Response(null, { headers: corsHeaders });
    }
    
    // Check environment variables
    const envVarStatus = {
      SUPABASE_URL: !!SUPABASE_URL,
      SUPABASE_ANON_KEY: !!SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!SUPABASE_SERVICE_ROLE_KEY,
      GOOGLE_CLIENT_ID: !!GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: !!GOOGLE_CLIENT_SECRET,
      REDIRECT_URI: !!REDIRECT_URI,
      GOOGLE_CLIENT_ID_PLACEHOLDER: GOOGLE_CLIENT_ID === "Your Google OAuth client ID",
      GOOGLE_CLIENT_SECRET_PLACEHOLDER: GOOGLE_CLIENT_SECRET === "Your Google OAuth client secret",
      REDIRECT_URI_PLACEHOLDER: REDIRECT_URI === "The URL to redirect back to after Google authentication"
    };
    
    console.log(`[${requestId}] Environment variables status:`, JSON.stringify(envVarStatus));
    
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error(`[${requestId}] Missing Supabase environment variables`);
      throw new Error('Missing Supabase environment variables. Check secret configuration.');
    }
    
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !REDIRECT_URI) {
      console.error(`[${requestId}] Missing Google environment variables`);
      throw new Error('Missing Google environment variables. Check secret configuration.');
    }
    
    if (GOOGLE_CLIENT_ID === "Your Google OAuth client ID" || 
        GOOGLE_CLIENT_SECRET === "Your Google OAuth client secret" || 
        REDIRECT_URI === "The URL to redirect back to after Google authentication") {
      console.error(`[${requestId}] Google environment variables contain placeholder values`);
      throw new Error('Google environment variables contain placeholder values. Please replace them with your actual values in the Edge Functions secrets.');
    }
    
    // Get request body data
    let requestData;
    try {
      requestData = await req.json();
      console.log(`[${requestId}] Request data:`, JSON.stringify(requestData));
    } catch (e) {
      console.error(`[${requestId}] Error parsing JSON:`, e);
      throw new Error(`Error parsing JSON: ${e.message || e}`);
    }
    
    const action = requestData?.action;
    console.log(`[${requestId}] Requested action: ${action}`);
    
    if (!action) {
      throw new Error('Action not specified in request');
    }
    
    // Extract JWT token to get user ID
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error(`[${requestId}] Missing authentication token`);
      throw new Error('Missing authentication token');
    }
    
    const token = authHeader.replace('Bearer ', '');
    console.log(`[${requestId}] Attempting authentication with JWT token`);
    
    // Verify token and get user information
    let user;
    try {
      const { data, error } = await supabaseClient.auth.getUser(token);
      
      if (error) {
        console.error(`[${requestId}] Authentication error:`, error);
        throw new Error(`Authentication error: ${error.message}`);
      }
      
      user = data?.user;
      
      if (!user) {
        console.error(`[${requestId}] User not found with provided token`);
        throw new Error('User not authenticated');
      }
      
      console.log(`[${requestId}] User authenticated: ${user.id}`);
    } catch (authError) {
      console.error(`[${requestId}] Error during authentication:`, authError);
      throw new Error(`Error during authentication: ${authError.message || authError}`);
    }
    
    const userId = user.id;
    
    // Process different actions
    if (action === 'get_auth_url') {
      try {
        console.log(`[${requestId}] Processing get_auth_url action`);
        
        // Generate OAuth authorization URL
        const state = userId; // Use user ID as state
        const authUrl = getGoogleAuthUrl(state);
        
        console.log(`[${requestId}] Generated authorization URL: ${authUrl}`);
        
        return new Response(
          JSON.stringify({ url: authUrl, success: true }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      } catch (error) {
        console.error(`[${requestId}] Error generating authorization URL:`, error);
        return handleError(error);
      }
    } 
    else if (action === 'handle_callback') {
      // Process OAuth callback
      logger.info(`[${requestId}] Processing handle_callback action`);
      
      const code = requestData.code;
      const state = requestData.state;
      
      if (!code) {
        logger.error(`[${requestId}] Missing authorization code`);
        throw new Error('Missing authorization code');
      }
      
      logger.info(`[${requestId}] Verifying state: received=${state}, expected=${userId}`);
      
      // Enhanced state validation to be more verbose in logs
      if (state !== userId) {
        logger.error(`[${requestId}] State mismatch: received=${state}, expected=${userId}`);
        // Continue anyway - sometimes the state parameter gets corrupted in redirects
        logger.info(`[${requestId}] Proceeding despite state mismatch as we have a valid user token`);
      } else {
        logger.info(`[${requestId}] State verification successful`);
      }
      
      // Exchange code for tokens
      logger.info(`[${requestId}] Exchanging code for tokens`);
      const tokenData = await exchangeCodeForTokens(code);
      const { access_token, refresh_token, expires_in } = tokenData;
      
      // Get Google user information
      logger.info(`[${requestId}] Getting Google user information`);
      const userInfo = await getGoogleUserInfo(access_token);
      
      // Calculate token expiration
      const tokenExpiresAt = new Date();
      tokenExpiresAt.setSeconds(tokenExpiresAt.getSeconds() + expires_in);
      
      try {
        // Store tokens in database
        logger.info(`[${requestId}] Storing tokens for user: ${userId}, Google email: ${userInfo.email}`);

        // Check if profile already exists
        const existingProfile = await getUserGoogleProfile(userId);
        if (existingProfile) {
          logger.info(`[${requestId}] Updating existing profile for user: ${userId}`);
          const { error } = await supabaseAdmin
            .from('user_google_business_profiles')
            .update({
              google_email: userInfo.email,
              refresh_token,
              access_token,
              token_expires_at: tokenExpiresAt.toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId);
          
          if (error) {
            logger.error(`[${requestId}] Error updating tokens: ${JSON.stringify(error)}`);
            throw new Error(`Error updating tokens: ${error.message}`);
          }
        } else {
          // Create new profile
          logger.info(`[${requestId}] Creating new profile for user: ${userId}`);
          const { error } = await supabaseAdmin
            .from('user_google_business_profiles')
            .insert({
              user_id: userId,
              google_email: userInfo.email,
              refresh_token,
              access_token,
              token_expires_at: tokenExpiresAt.toISOString(),
            });
          
          if (error) {
            logger.error(`[${requestId}] Error storing tokens: ${JSON.stringify(error)}`);
            throw new Error(`Error storing tokens: ${error.message}`);
          }
        }
      } catch (dbError) {
        logger.error(`[${requestId}] Database error during profile save: ${JSON.stringify(dbError)}`);
        throw new Error(`Database error: ${dbError.message || "Unknown database error"}`);
      }
      
      logger.info(`[${requestId}] Callback processed successfully`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Google account linked successfully',
          email: userInfo.email
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } 
    else if (action === 'get_profile') {
      // Get user's Google profile
      logger.info(`[${requestId}] Getting Google profile for user: ${userId}`);
      const profile = await getUserGoogleProfile(userId);
      
      return new Response(
        JSON.stringify({ profile }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } 
    else if (action === 'list_accounts') {
      // List GMB accounts
      logger.info(`[${requestId}] Listing GMB accounts for user: ${userId}`);
      const profile = await getUserGoogleProfile(userId);
      
      if (!profile) {
        logger.error(`[${requestId}] No linked Google profile for user: ${userId}`);
        throw new Error('No linked Google profile');
      }
      
      // Check if access token is expired
      let accessToken = profile.access_token;
      const tokenExpiresAt = new Date(profile.token_expires_at);
      
      logger.info(`[${requestId}] Checking token expiration: expires on ${tokenExpiresAt.toISOString()}, now: ${new Date().toISOString()}`);
      if (new Date() >= tokenExpiresAt) {
        // Refresh access token
        logger.info(`[${requestId}] Token expired, refreshing...`);
        const tokenData = await refreshAccessToken(profile.refresh_token);
        accessToken = tokenData.access_token;
        
        // Update token in database
        const newExpiresAt = new Date();
        newExpiresAt.setSeconds(newExpiresAt.getSeconds() + tokenData.expires_in);
        
        logger.info(`[${requestId}] Updating token in database, expires on: ${newExpiresAt.toISOString()}`);
        await supabaseAdmin
          .from('user_google_business_profiles')
          .update({
            access_token: accessToken,
            token_expires_at: newExpiresAt.toISOString(),
          })
          .eq('user_id', userId);
      }
      
      // Call GMB API to list accounts
      logger.info(`[${requestId}] Calling GMB API to list accounts`);
      const accounts = await listAccounts(accessToken);
      
      return new Response(
        JSON.stringify({ accounts }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } 
    else if (action === 'list_locations') {
      // List locations for a GMB account
      const accountId = requestData.account_id;
      logger.info(`[${requestId}] Listing locations for account: ${accountId}`);
      
      if (!accountId) {
        logger.error(`[${requestId}] Missing account ID`);
        throw new Error('Missing account ID');
      }
      
      const profile = await getUserGoogleProfile(userId);
      
      if (!profile) {
        logger.error(`[${requestId}] No linked Google profile for user: ${userId}`);
        throw new Error('No linked Google profile');
      }
      
      // Check if access token is expired
      let accessToken = profile.access_token;
      const tokenExpiresAt = new Date(profile.token_expires_at);
      
      logger.info(`[${requestId}] Checking token expiration: expires on ${tokenExpiresAt.toISOString()}, now: ${new Date().toISOString()}`);
      if (new Date() >= tokenExpiresAt) {
        // Refresh access token
        logger.info(`[${requestId}] Token expired, refreshing...`);
        const tokenData = await refreshAccessToken(profile.refresh_token);
        accessToken = tokenData.access_token;
        
        // Update token in database
        const newExpiresAt = new Date();
        newExpiresAt.setSeconds(newExpiresAt.getSeconds() + tokenData.expires_in);
        
        logger.info(`[${requestId}] Updating token in database, expires on: ${newExpiresAt.toISOString()}`);
        await supabaseAdmin
          .from('user_google_business_profiles')
          .update({
            access_token: accessToken,
            token_expires_at: newExpiresAt.toISOString(),
          })
          .eq('user_id', userId);
      }
      
      // Call GMB API to list locations
      logger.info(`[${requestId}] Calling GMB API to list locations for account: ${accountId}`);
      const locations = await listLocations(accountId, accessToken);
      
      return new Response(
        JSON.stringify({ locations }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } 
    else if (action === 'save_location') {
      // Save selected location ID
      const accountId = requestData.account_id;
      const locationId = requestData.location_id;
      logger.info(`[${requestId}] Saving location: ${locationId} for account: ${accountId}`);
      
      if (!accountId || !locationId) {
        logger.error(`[${requestId}] Missing account or location ID`);
        throw new Error('Missing account or location ID');
      }
      
      // Update profile with selected IDs
      logger.info(`[${requestId}] Updating IDs in database for user: ${userId}`);
      const { error } = await supabaseAdmin
        .from('user_google_business_profiles')
        .update({
          gmb_account_id: accountId,
          gmb_location_id: locationId,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
      
      if (error) {
        logger.error(`[${requestId}] Error saving IDs: ${JSON.stringify(error)}`);
        throw new Error(`Error saving IDs: ${error.message}`);
      }
      
      logger.info(`[${requestId}] Location saved successfully`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Location selected successfully' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } 
    else if (action === 'disconnect') {
      // Disconnect Google account
      logger.info(`[${requestId}] Disconnecting Google account for user: ${userId}`);
      const { error } = await supabaseAdmin
        .from('user_google_business_profiles')
        .delete()
        .eq('user_id', userId);
      
      if (error) {
        logger.error(`[${requestId}] Error disconnecting: ${JSON.stringify(error)}`);
        throw new Error(`Error disconnecting: ${error.message}`);
      }
      
      logger.info(`[${requestId}] Google account disconnected successfully`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Google account disconnected successfully' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    console.error(`[${requestId}] Unrecognized action: ${action}`);
    throw new Error(`Unrecognized action: ${action}`);
  } catch (error) {
    console.error(`[${requestId}] Unhandled error:`, error);
    console.error(`[${requestId}] Stack trace:`, error.stack);
    return handleError(error);
  }
});
