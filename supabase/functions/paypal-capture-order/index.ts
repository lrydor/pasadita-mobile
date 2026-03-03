// This Edge Function "captures" (finalizes) a PayPal payment.
//
// Flow:
// 1. User approved payment on PayPal's page
// 2. App sends us the PayPal order ID
// 3. We call PayPal's capture endpoint to actually charge the money
// 4. We return success/failure

import { corsHeaders } from "../_shared/cors.ts";

async function getPayPalAccessToken(): Promise<string> {
  const clientId = Deno.env.get("PAYPAL_CLIENT_ID")!;
  const secret = Deno.env.get("PAYPAL_SECRET")!;
  const credentials = btoa(`${clientId}:${secret}`);

  const res = await fetch(
    "https://api-m.sandbox.paypal.com/v1/oauth2/token",
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    },
  );

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`PayPal auth failed: ${JSON.stringify(data)}`);
  }

  return data.access_token;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { order_id } = await req.json();

    if (!order_id) {
      return new Response(
        JSON.stringify({ error: "order_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const accessToken = await getPayPalAccessToken();

    // Capture the order -- this is what actually charges the customer
    // Docs: https://developer.paypal.com/docs/api/orders/v2/#orders_capture
    const captureRes = await fetch(
      `https://api-m.sandbox.paypal.com/v2/checkout/orders/${order_id}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    const captureData = await captureRes.json();

    if (!captureRes.ok) {
      return new Response(
        JSON.stringify({ error: "Capture failed", details: captureData }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // captureData.status should be "COMPLETED" if payment went through
    return new Response(
      JSON.stringify({
        id: captureData.id,
        status: captureData.status,
        payer: captureData.payer,  // Info about who paid
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
