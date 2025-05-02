
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { corsHeaders, errorResponse, handleCorsOptions } from "../utils/errorHandling.ts";
import { RequestData, DeleteUserResponse } from "./types.ts";
import { logger } from "./logger.ts";
import { deleteUserProfile, deleteAuthUser } from "./userManagement.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    logger.log("OPTIONS CORS request received");
    return handleCorsOptions();
  }

  try {
    logger.log("Starting delete-user function");
    
    // Create a Supabase client with the service role key
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get request data
    const requestData: RequestData = await req.json();
    logger.log("Data received:", JSON.stringify(requestData));
    
    const { userId } = requestData;

    // Validate required data
    if (!userId) {
      logger.log("Missing user ID");
      return new Response(
        JSON.stringify({ error: "Missing user ID" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // First delete the profile (the order matters because of foreign key constraints)
    try {
      await deleteUserProfile(supabaseAdmin, userId);
    } catch (error) {
      logger.error("Error during profile deletion:", error);
      return errorResponse(error);
    }

    // Then delete the auth user
    try {
      await deleteAuthUser(supabaseAdmin, userId);
    } catch (error) {
      logger.error("Error during auth user deletion:", error);
      return errorResponse(error);
    }

    logger.log("User successfully deleted");

    return new Response(
      JSON.stringify({ success: true } as DeleteUserResponse),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    // Use our secure error handling system
    return errorResponse(error);
  }
});
