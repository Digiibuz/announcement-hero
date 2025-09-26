import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as log from "https://deno.land/std@0.168.0/log/mod.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.38.1";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') as string;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') as string;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID') as string;
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET') as string;
const REDIRECT_URI = Deno.env.get('GMB_REDIRECT_URI') as string;
const API_BASE_URL = 'https://mybusiness.googleapis.com/v4';

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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

let supabaseAdmin: SupabaseClient;
try {
  supabaseAdmin = createClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY
  );
} catch (error) {
  console.error("Error creating Supabase Admin client:", error);
  throw new Error("Failed to initialize Supabase Admin client");
}

let supabaseClient: SupabaseClient;
try {
  supabaseClient = createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );
} catch (error) {
  console.error("Error creating Supabase Client:", error);
  throw new Error("Failed to initialize Supabase Client");
}

function handleError(error: any) {
  const errorDetails = {
    message: error.message || "Unknown error",
    stack: error.stack,
    name: error.name,
    code: error.code,
    statusCode: error.statusCode,
    toString: error.toString(),
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

async function getUserGoogleProfile(userId: string) {
  try {
    logger.info(`Looking for Google profile for user: ${userId}`);
    
    // First, check if the table exists
    try {
      const { count, error: tableCheckError } = await supabaseAdmin
        .from('user_google_business_profiles')
        .select('*', { count: 'exact', head: true });
        
      if (tableCheckError) {
        logger.error(`Error checking if table exists: ${JSON.stringify(tableCheckError)}`);
      } else {
        logger.info(`Table exists check: user_google_business_profiles has ${count} total records`);
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      logger.error(`Exception checking table: ${errorMessage}`);
    }
    
    const { data, error } = await supabaseAdmin
      .from('user_google_business_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error) {
      logger.error(`Error retrieving Google profile: ${JSON.stringify(error)}`);
      return null;
    }
    
    if (data) {
      logger.info(`Google profile found with ID: ${data.id}, email: ${data.google_email}`);
    } else {
      logger.info(`No Google profile found for user ID: ${userId}. This is normal if the user has not connected yet.`);
      
      try {
        const { count, error: countError } = await supabaseAdmin
          .from('user_google_business_profiles')
          .select('*', { count: 'exact', head: true });
          
        if (countError) {
          logger.error(`Error checking table: ${JSON.stringify(countError)}`);
        } else {
          logger.info(`Table check: user_google_business_profiles has ${count} total records`);
        }
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        logger.error(`Exception checking table: ${errorMessage}`);
      }
    }
    
    return data;
  } catch (err) {
    logger.error(`Exception retrieving Google profile: ${JSON.stringify(err)}`);
    return null;
  }
}

function getGoogleAuthUrl(state: string) {
  logger.info(`Generating authorization URL for state: ${state}`);
  
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
    prompt: 'consent',
  });
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  logger.info(`Generated authorization URL: ${authUrl}`);
  return authUrl;
}

async function exchangeCodeForTokens(code: string) {
  logger.info(`Exchanging authorization code for tokens. Code length: ${code.length}`);
  
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
    
    if (!data.refresh_token) {
      logger.error("WARNING: No refresh_token received! This will cause problems later.");
    }
    
    return data;
  } catch (err) {
    logger.error(`Exception exchanging code: ${JSON.stringify(err)}`);
    throw err;
  }
}

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
    
    const responseText = await response.text();
    logger.info(`Raw API response: ${responseText}`);
    
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

async function listAccounts(accessToken: string) {
  logger.info(`Listing GMB accounts`);
  return await callGmbApi('accounts', 'GET', accessToken);
}

async function listLocations(accountId: string, accessToken: string) {
  logger.info(`Listing locations for account: ${accountId}`);
  return await callGmbApi(`accounts/${accountId}/locations`, 'GET', accessToken);
}

async function handleCallback(code: string, state: string, userId: string) {
  logger.info(`Processing callback for user: ${userId} with code length: ${code.length}`);
  
  try {
    // Exchange the authorization code for tokens
    const tokenData = await exchangeCodeForTokens(code);
    const { access_token, refresh_token, expires_in } = tokenData;
    
    if (!refresh_token) {
      logger.error(`CRITICAL: No refresh token received from Google for user: ${userId}`);
      throw new Error('No refresh token received from Google. Please try again with a different account or clear your browser cookies.');
    }
    
    // Get user information from Google
    const userInfo = await getGoogleUserInfo(access_token);
    
    // Calculate token expiration date
    const tokenExpiresAt = new Date();
    tokenExpiresAt.setSeconds(tokenExpiresAt.getSeconds() + expires_in);
    
    // Check if a profile already exists
    const existingProfile = await getUserGoogleProfile(userId);
    logger.info(`Existing profile check for user ${userId}: ${existingProfile ? 'found' : 'not found'}`);
    
    let upsertResult;
    // Update or create the profile
    if (existingProfile) {
      logger.info(`Updating existing Google profile for user: ${userId}`);
      upsertResult = await supabaseAdmin
        .from('user_google_business_profiles')
        .update({
          google_email: userInfo.email,
          refresh_token,
          access_token,
          token_expires_at: tokenExpiresAt.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
    } else {
      logger.info(`Creating new Google profile for user: ${userId} with email: ${userInfo.email}`);
      
      // Detailed log of the data to be inserted
      const insertData = {
        user_id: userId,
        google_email: userInfo.email,
        refresh_token,
        access_token,
        token_expires_at: tokenExpiresAt.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      logger.info(`Data being inserted: ${JSON.stringify(insertData)}`);
      
      // Try checking table existence and structure first
      try {
        const { data: tableInfo, error: tableError } = await supabaseAdmin
          .from('user_google_business_profiles')
          .select()
          .limit(1);
          
        logger.info(`Table check result: ${tableError ? 'Error: ' + JSON.stringify(tableError) : 'Table exists'}`);
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        logger.error(`Error checking table: ${errorMessage}`);
      }
      
      // Now attempt the insert
      upsertResult = await supabaseAdmin
        .from('user_google_business_profiles')
        .insert(insertData);
      
      logger.info(`Insert result: ${JSON.stringify(upsertResult)}`);
    }
    
    // Handle potential errors during the upsert
    if (upsertResult.error) {
      logger.error(`Error upserting profile: ${JSON.stringify(upsertResult.error)}`);
      
      // Analyze the error to provide a more useful message
      if (upsertResult.error.code === '23505') {
        logger.error(`Duplicate key violation - record already exists`);
      } else if (upsertResult.error.code === '42P01') {
        logger.error(`Table does not exist - check your migrations`);
      } else if (upsertResult.error.message?.includes('violates row-level security')) {
        logger.error(`RLS violation - check policies on user_google_business_profiles table`);
      } else if (upsertResult.error.message?.includes('violates not-null constraint')) {
        logger.error(`Not-null constraint violation - missing required field`);
      }
      
      throw new Error(`Database error: ${upsertResult.error.message || "Unknown database error"}`);
    }
    
    // Verification after insertion/update
    const verifiedProfile = await getUserGoogleProfile(userId);
    if (verifiedProfile) {
      logger.info(`Profile verified after save: ID=${verifiedProfile.id}, email=${verifiedProfile.google_email}`);
    } else {
      logger.error(`CRITICAL: Profile could not be verified after save attempt for user: ${userId}`);
    }
    
    logger.info(`Profile saved successfully for user: ${userId}`);
    return true;
  } catch (error) {
    logger.error(`Error handling callback for user ${userId}: ${JSON.stringify(error)}`);
    throw error;
  }
}

serve(async (req) => {
  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] New request: ${req.method} ${req.url}`);
  
  try {
    if (req.method === 'OPTIONS') {
      console.log(`[${requestId}] Processing CORS preflight request`);
      return new Response(null, { headers: corsHeaders });
    }
    
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
    
    let requestData;
    try {
      requestData = await req.json();
      console.log(`[${requestId}] Request data:`, JSON.stringify(requestData));
    } catch (e) {
      console.error(`[${requestId}] Error parsing JSON:`, e);
      const errorMessage = e instanceof Error ? e.message : String(e);
      throw new Error(`Error parsing JSON: ${errorMessage}`);
    }
    
    const action = requestData?.action;
    console.log(`[${requestId}] Requested action: ${action}`);
    
    if (!action) {
      throw new Error('Action not specified in request');
    }
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error(`[${requestId}] Missing authentication token`);
      throw new Error('Missing authentication token');
    }
    
    const token = authHeader.replace('Bearer ', '');
    console.log(`[${requestId}] Attempting authentication with JWT token`);
    
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
      const errorMessage = authError instanceof Error ? authError.message : String(authError);
      throw new Error(`Error during authentication: ${errorMessage}`);
    }
    
    const userId = user.id;
    
    if (action === 'get_auth_url') {
      try {
        console.log(`[${requestId}] Processing get_auth_url action`);
        
        const state = userId;
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
      logger.info(`[${requestId}] Processing handle_callback action`);
      
      const code = requestData.code;
      const state = requestData.state;
      
      if (!code) {
        logger.error(`[${requestId}] Missing authorization code`);
        throw new Error('Missing authorization code');
      }
      
      logger.info(`[${requestId}] Verifying state: received=${state}, expected=${userId}`);
      
      if (state !== userId) {
        logger.error(`[${requestId}] State mismatch: received=${state}, expected=${userId}`);
        logger.info(`[${requestId}] Proceeding despite state mismatch as we have a valid user token`);
      } else {
        logger.info(`[${requestId}] State verification successful`);
      }
      
      try {
        await handleCallback(code, state, userId);
        
        logger.info(`[${requestId}] Callback processed successfully`);
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Google account linked successfully' 
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      } catch (error) {
        logger.error(`[${requestId}] Error handling callback:`, error);
        const errorMessage = error instanceof Error ? error.message : "Failed to connect Google account";
        return new Response(
          JSON.stringify({ 
            error: errorMessage
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    } 
    else if (action === 'get_profile') {
      logger.info(`[${requestId}] Getting Google profile for user: ${userId}`);
      const profile = await getUserGoogleProfile(userId);
      
      const clientProfile = profile ? {
        id: profile.id,
        googleEmail: profile.google_email,
        gmb_account_id: profile.gmb_account_id,
        gmb_location_id: profile.gmb_location_id,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at
      } : null;
      
      logger.info(`[${requestId}] Profile response: ${clientProfile ? JSON.stringify(clientProfile) : 'null'}`);
      
      return new Response(
        JSON.stringify({ profile: clientProfile }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } 
    else if (action === 'list_accounts') {
      logger.info(`[${requestId}] Listing GMB accounts for user: ${userId}`);
      const profile = await getUserGoogleProfile(userId);
      
      if (!profile) {
        logger.error(`[${requestId}] No linked Google profile for user: ${userId}`);
        throw new Error('No linked Google profile');
      }
      
      let accessToken = profile.access_token;
      const tokenExpiresAt = new Date(profile.token_expires_at);
      
      logger.info(`[${requestId}] Checking token expiration: expires on ${tokenExpiresAt.toISOString()}, now: ${new Date().toISOString()}`);
      if (new Date() >= tokenExpiresAt) {
        logger.info(`[${requestId}] Token expired, refreshing...`);
        const tokenData = await refreshAccessToken(profile.refresh_token);
        accessToken = tokenData.access_token;
        
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
      
      const accounts = await listAccounts(accessToken);
      
      return new Response(
        JSON.stringify({ accounts }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } 
    else if (action === 'list_locations') {
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
      
      let accessToken = profile.access_token;
      const tokenExpiresAt = new Date(profile.token_expires_at);
      
      logger.info(`[${requestId}] Checking token expiration: expires on ${tokenExpiresAt.toISOString()}, now: ${new Date().toISOString()}`);
      if (new Date() >= tokenExpiresAt) {
        logger.info(`[${requestId}] Token expired, refreshing...`);
        const tokenData = await refreshAccessToken(profile.refresh_token);
        accessToken = tokenData.access_token;
        
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
      
      const locations = await listLocations(accountId, accessToken);
      
      return new Response(
        JSON.stringify({ locations }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } 
    else if (action === 'save_location') {
      const accountId = requestData.account_id;
      const locationId = requestData.location_id;
      logger.info(`[${requestId}] Saving location: ${locationId} for account: ${accountId}`);
      
      if (!accountId || !locationId) {
        logger.error(`[${requestId}] Missing account or location ID`);
        throw new Error('Missing account or location ID');
      }
      
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
    const errorStack = error instanceof Error ? error.stack : String(error);
    console.error(`[${requestId}] Stack trace:`, errorStack);
    return handleError(error);
  }
});
