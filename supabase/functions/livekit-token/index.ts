import { AccessToken } from "npm:livekit-server-sdk@2.19.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  // Handle browser preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  // Only allow POST
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({
        error: "POST request required",
      }),
      {
        status: 405,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }

  try {
    // Get LiveKit secrets from Supabase environment
    const livekitApiKey = Deno.env.get("LIVEKIT_API_KEY");
    const livekitApiSecret = Deno.env.get("LIVEKIT_API_SECRET");
    const livekitUrl = Deno.env.get("LIVEKIT_URL");

    if (!livekitApiKey || !livekitApiSecret || !livekitUrl) {
      return new Response(
        JSON.stringify({
          error: "LiveKit server configuration is missing",
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Read request data
    const body = await req.json();

    const roomName = body.room_name;
    const participantIdentity = body.participant_identity;
    const participantName = body.participant_name;

    if (!roomName || !participantIdentity) {
      return new Response(
        JSON.stringify({
          error:
            "room_name and participant_identity are required",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Create LiveKit access token
    const token = new AccessToken(
      livekitApiKey,
      livekitApiSecret,
      {
        identity: participantIdentity,
        name: participantName || participantIdentity,
        ttl: "1h",
      }
    );

    // Permissions for the meeting
    token.addGrant({
      roomJoin: true,
      room: roomName,
      canSubscribe: true,
      canPublish: true,
      canPublishData: true,
    });

    // Generate JWT
    const participantToken = await token.toJwt();

    return new Response(
      JSON.stringify({
        server_url: livekitUrl,
        participant_token: participantToken,
      }),
      {
        status: 201,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("LiveKit token error:", error);

    return new Response(
      JSON.stringify({
        error: "Unable to create LiveKit token",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});