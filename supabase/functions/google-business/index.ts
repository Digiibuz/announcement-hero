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

let supabaseAdmin;
try {
  supabaseAdmin = createClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY
  );
} catch (error) {
  console.error("Error creating Supabase Admin client:", error);
}

let supabaseClient;
try {
  supabaseClient = createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );
} catch (error) {
  console.error("Error creating Supabase Client:", error);
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
      logger.error(`Exception checking table: ${e.message}`);
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
        logger.error(`Exception checking table: ${e.message}`);
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
      logger.error("WARNING: No refresh_token received! This might be because this Google account was already authorized previously. Try using a different account or revoking access at https://myaccount.google.com/permissions");
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
      
      if (response.status === 403) {
        logger.error(`Permission error: User may not have proper permissions to the Google My Business API`);
        throw new Error(`You don't have permission to access Google My Business. Make sure your Google account has a GMB listing and verify that you have the necessary permissions.`);
      }
      
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
      throw new Error(`Error parsing JSON: ${e.message || e}`);
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
      throw new Error(`Error during authentication: ${authError.message || authError}`);
    }
    
    const userId = user.id;
    
    if (action === 'get_auth_url') {
      try {
        console.log(`[${requestId}] Processing get_auth_url action`);
        
        const state = requestData.state || userId;
        const authUrl = getGoogleAuthUrl(state);
        
        console.log(`[${requestId}] Generated authorization URL with state: ${state}`);
        
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
      
      logger.info(`[${requestId}] Received state: ${state}`);
      
      logger.info(`[${requestId}] Exchanging code for tokens`);
      const tokenData = await exchangeCodeForTokens(code);
      const { access_token, refresh_token, expires_in } = tokenData;
      
      if (!refresh_token) {
        logger.error(`[${requestId}] CRITICAL: No refresh token received from Google!`);
        logger.error(`[${requestId}] This often happens when the user has previously authorized this application.`);
        logger.error(`[${requestId}] They should try a different Google account or revoke access at https://myaccount.google.com/permissions`);
        throw new Error('No refresh token received from Google. This usually happens when your account has already been connected before. Please try a different Google account or revoke the app permissions in your Google account settings (myaccount.google.com/permissions) and try again.');
      }
      
      logger.info(`[${requestId}] Getting Google user information`);
      const userInfo = await getGoogleUserInfo(access_token);
      
      const tokenExpiresAt = new Date();
      tokenExpiresAt.setSeconds(tokenExpiresAt.getSeconds() + expires_in);
      
      try {
        const existingProfile = await getUserGoogleProfile(userId);
        logger.info(`[${requestId}] Profile exists check: ${existingProfile ? 'yes' : 'no'}`);
        
        if (existingProfile && !refresh_token) {
          logger.info(`[${requestId}] Detected reconnection without refresh token - deleting old connection first`);
          await supabaseAdmin
            .from('user_google_business_profiles')
            .delete()
            .eq('user_id', userId);
            
          logger.info(`[${requestId}] Old connection deleted, proceeding with new connection`);
        }
        
        let upsertResult;
        if (existingProfile) {
          logger.info(`[${requestId}] Updating existing profile for user: ${userId}`);
          upsertResult = await supabaseAdmin
            .from('user_google_business_profiles')
            .update({
              google_email: userInfo.email,
              refresh_token: refresh_token || existingProfile.refresh_token,
              access_token,
              token_expires_at: tokenExpiresAt.toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId);
        } else {
          logger.info(`[${requestId}] Creating new profile for user: ${userId} with email: ${userInfo.email}`);
          logger.info(`[${requestId}] Data being inserted: user_id=${userId}, google_email=${userInfo.email}, token_expires_at=${tokenExpiresAt.toISOString()}, refresh_token present=${!!refresh_token}, access_token present=${!!access_token}`);
          
          const insertData = {
            user_id: userId,
            google_email: userInfo.email,
            refresh_token: refresh_token,
            access_token: access_token,
            token_expires_at: tokenExpiresAt.toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          logger.info(`[${requestId}] Full insert data: ${JSON.stringify(insertData)}`);
          
          upsertResult = await supabaseAdmin
            .from('user_google_business_profiles')
            .insert(insertData);
            
          logger.info(`[${requestId}] Insert result: ${JSON.stringify(upsertResult)}`);
        }
        
        if (upsertResult.error) {
          logger.error(`[${requestId}] Error upserting profile: ${JSON.stringify(upsertResult.error)}`);
          
          if (upsertResult.error.code === '23505') {
            logger.error(`[${requestId}] Duplicate key violation - record already exists`);
          } else if (upsertResult.error.code === '42P01') {
            logger.error(`[${requestId}] Table does not exist - check your migrations`);
          } else if (upsertResult.error.message?.includes('violates row-level security')) {
            logger.error(`[${requestId}] RLS violation - check policies on user_google_business_profiles table`);
          } else if (upsertResult.error.message?.includes('violates not-null constraint')) {
            logger.error(`[${requestId}] Not-null constraint violation - missing required field`);
            logger.error(`[${requestId}] Attempted fields: ${Object.keys(existingProfile ? {
              google_email: userInfo.email,
              refresh_token: refresh_token || existingProfile.refresh_token,
              access_token,
              token_expires_at: tokenExpiresAt.toISOString(),
              updated_at: new Date().toISOString()
            } : insertData).join(', ')}`);
          }
          
          throw new Error(`Database error: ${upsertResult.error.message || "Unknown database error"}`);
        }
        
        const verifyProfile = await getUserGoogleProfile(userId);
        if (verifyProfile) {
          logger.info(`[${requestId}] Profile verified after save: ID=${verifyProfile.id}, email=${verifyProfile.google_email}`);
        } else {
          logger.error(`[${requestId}] CRITICAL: Profile could not be verified after save attempt!`);
          logger.error(`[${requestId}] Will try direct database query to debug...`);
          
          try {
            const { data: directData, error: directError } = await supabaseAdmin
              .from('user_google_business_profiles')
              .select('id, user_id, google_email')
              .eq('user_id', userId);
              
            if (directError) {
              logger.error(`[${requestId}] Direct query error: ${JSON.stringify(directError)}`);
            } else if (directData && directData.length > 0) {
              logger.info(`[${requestId}] Direct query found profile: ${JSON.stringify(directData)}`);
            } else {
              logger.error(`[${requestId}] Direct query confirmed profile does not exist!`);
            }
          } catch (e) {
            logger.error(`[${requestId}] Exception during direct query: ${e.message}`);
          }
        }
        
        logger.info(`[${requestId}] Profile save operation completed: ${upsertResult.statusText || "Success"}`);
      } catch (dbError) {
        logger.error(`[${requestId}] Database error during profile save: ${JSON.stringify(dbError)}`);
        throw new Error(`Database error: ${dbError.message || "Unknown database error"}`);
      }
      
      try {
        logger.info(`[${requestId}] Validating GMB access by listing accounts`);
        const accounts = await listAccounts(access_token);
        
        if (accounts && accounts.accounts && accounts.accounts.length > 0) {
          logger.info(`[${requestId}] GMB access validated successfully! Found ${accounts.accounts.length} accounts`);
        } else {
          logger.warn(`[${requestId}] GMB API returned empty accounts list. User may not have any GMB listings`);
        }
      } catch (gmbValidationError) {
        logger.error(`[${requestId}] GMB validation error: ${JSON.stringify(gmbValidationError)}`);
        // We won't throw here as we don't want to block the connection, just log the issue
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
    console.error(`[${requestId}] Stack trace:`, error.stack);
    return handleError(error);
  }
});
