// This Edge Function runs on Supabase's servers (Deno runtime).
// It creates a PayPal order and returns the approval URL.
//
// Flow:
// 1. App sends a POST with { amount: "25.00", currency: "USD" }
// 2. We authenticate with PayPal using Client ID + Secret (Basic Auth)
// 3. PayPal gives us an access token
// 4. We use that token to create an order
// 5. We return the approval URL to the app

import { corsHeaders } from "../_shared/cors.ts";

// Helper: Get an OAuth2 access token from PayPal
// PayPal uses OAuth2 "client_credentials" flow -- you send your
// client ID and secret, and they return a short-lived token.
async function getPayPalAccessToken(): Promise<string> {
  const clientId = Deno.env.get("PAYPAL_CLIENT_ID")!;
  const secret = Deno.env.get("PAYPAL_SECRET")!;

  // Base64-encode "clientId:secret" for HTTP Basic Auth
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
  // Handle CORS preflight (browsers send an OPTIONS request first)
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { amount, currency, return_url, cancel_url } = await req.json();

    if (!amount) {
      return new Response(
        JSON.stringify({ error: "amount is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Step 1: Get access token
    const accessToken = await getPayPalAccessToken();

    // Step 2: Create a PayPal order
    // Docs: https://developer.paypal.com/docs/api/orders/v2/#orders_create
    const orderRes = await fetch(
      "https://api-m.sandbox.paypal.com/v2/checkout/orders",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          intent: "CAPTURE", // We want to capture (charge) immediately
          purchase_units: [
            {
              amount: {
                currency_code: currency || "USD",
                value: amount, // e.g. "25.00"
              },
            },
          ],
          payment_source: {
            paypal: {
              experience_context: {
                // Where PayPal redirects after approval
                return_url: return_url || "https://example.com/return",
                cancel_url: cancel_url || "https://example.com/cancel",
                user_action: "PAY_NOW",
                brand_name: "La Pasadita",
              },
            },
          },
        }),
      },
    );

    const orderData = await orderRes.json();

    if (!orderRes.ok) {
      return new Response(
        JSON.stringify({ error: "PayPal order creation failed", details: orderData }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Step 3: Find the approval URL from the response links
    // PayPal returns an array of links like:
    // [{ rel: "self", href: "..." }, { rel: "payer-action", href: "..." }]
    // "payer-action" is where the user goes to approve/pay
    const approvalLink = orderData.links?.find(
      (link: { rel: string }) => link.rel === "payer-action",
    );

    return new Response(
      JSON.stringify({
        id: orderData.id,          // PayPal order ID (e.g. "5O190127TN364715T")
        approval_url: approvalLink?.href || null,
        status: orderData.status,  // Should be "PAYER_ACTION_REQUIRED"
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
