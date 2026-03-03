// lib/paypal.ts
//
// This module handles the PayPal payment flow from the app side.
// It calls two Supabase Edge Functions:
//   1. paypal-create-order  -> creates a PayPal order, returns approval URL
//   2. paypal-capture-order -> captures (charges) the payment after approval
//
// And uses expo-web-browser to open the PayPal payment page.

import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { supabase } from "./supabase";

// This is the deep link URL that PayPal will redirect to after the user
// approves or cancels. It uses the "pasadita://" scheme we added to app.json.
const RETURN_URL = Linking.createURL("checkout/paypal-return");
const CANCEL_URL = Linking.createURL("checkout/paypal-cancel");

type CreateOrderResult = {
  id: string;           // PayPal order ID
  approval_url: string; // URL to open in browser
};

type CaptureResult = {
  id: string;
  status: string; // "COMPLETED" on success
};

/**
 * Step 1: Create a PayPal order via our Edge Function.
 * Returns the PayPal order ID and the URL where the user needs to go to pay.
 */
export async function createPayPalOrder(
  amount: string,
  currency = "USD",
): Promise<CreateOrderResult> {
  // supabase.functions.invoke() calls a Supabase Edge Function.
  // It automatically includes the user's auth token in the request.
  const { data, error } = await supabase.functions.invoke(
    "paypal-create-order",
    {
      body: {
        amount,
        currency,
        return_url: RETURN_URL,
        cancel_url: CANCEL_URL,
      },
    },
  );

  if (error) throw new Error(error.message);
  if (!data?.approval_url) {
    throw new Error(data?.error || "No approval URL returned");
  }

  return data as CreateOrderResult;
}

/**
 * Step 2: Open the PayPal approval page in an in-app browser.
 * Returns the redirect URL (which contains the PayPal token/order ID).
 * Returns null if the user cancelled.
 */
export async function openPayPalApproval(
  approvalUrl: string,
): Promise<{ token: string | null; cancelled: boolean }> {
  // openAuthSessionAsync opens a browser and waits for a redirect
  // back to your app's URL scheme. It's the same pattern used for
  // OAuth logins (Google, Apple, etc).
  const result = await WebBrowser.openAuthSessionAsync(
    approvalUrl,
    RETURN_URL,
    { preferEphemeralSession: true },
  );

  if (result.type === "cancel" || result.type === "dismiss") {
    return { token: null, cancelled: true };
  }

  if (result.type === "success" && result.url) {
    // PayPal appends ?token=PAYPAL_ORDER_ID&PayerID=XYZ to the return URL
    const url = new URL(result.url);
    const token = url.searchParams.get("token");
    return { token, cancelled: false };
  }

  return { token: null, cancelled: true };
}

/**
 * Step 3: Capture the payment (actually charge the customer).
 * Call this after the user approved the payment on PayPal's page.
 */
export async function capturePayPalOrder(
  orderId: string,
): Promise<CaptureResult> {
  const { data, error } = await supabase.functions.invoke(
    "paypal-capture-order",
    {
      body: { order_id: orderId },
    },
  );

  if (error) throw new Error(error.message);
  if (data?.status !== "COMPLETED") {
    throw new Error(data?.error || `Payment status: ${data?.status}`);
  }

  return data as CaptureResult;
}
