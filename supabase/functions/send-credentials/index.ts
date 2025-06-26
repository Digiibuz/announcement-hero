
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import React from 'npm:react@18.3.1';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import { CredentialsEmail } from './_templates/credentials-email.tsx';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SendCredentialsRequest {
  userEmail: string;
  userName: string;
  password: string;
  companyName?: string;
  websiteUrl?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userEmail, userName, password, companyName, websiteUrl }: SendCredentialsRequest = await req.json();

    console.log('Sending credentials email to:', userEmail);

    // Generate HTML email using React template
    const html = await renderAsync(
      React.createElement(CredentialsEmail, {
        userName,
        userEmail,
        password,
        companyName: companyName || 'Votre entreprise',
        websiteUrl: websiteUrl || '',
        loginUrl: 'https://www.app.digiibuz.fr/'
      })
    );

    const emailResponse = await resend.emails.send({
      from: "Digiibuz <noreply@digiibuz.fr>",
      to: [userEmail],
      bcc: ["melvin.bouquet@digiibuz.fr"],
      subject: `Vos identifiants de connexion Digiibuz - ${companyName || 'Bienvenue'}`,
      html,
    });

    console.log("Credentials email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending credentials email:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);
