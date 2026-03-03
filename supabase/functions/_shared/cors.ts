// CORS headers allow your mobile app (and browser) to call
// the Edge Function from a different origin.
// Without these, the browser would block the request.
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};
