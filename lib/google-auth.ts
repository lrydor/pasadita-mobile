import * as WebBrowser from "expo-web-browser";
import { supabase } from "./supabase";

WebBrowser.maybeCompleteAuthSession();

export async function signInWithGoogle(): Promise<void> {
  const redirectUri = "pasadita://auth/callback";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: redirectUri,
      skipBrowserRedirect: true,
    },
  });

  if (error || !data.url) {
    throw new Error(error?.message ?? "No se pudo iniciar sesion con Google");
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);

  if (result.type !== "success" || !result.url) {
    throw new Error("Inicio de sesion con Google cancelado");
  }

  const url = new URL(result.url);
  const hashParams = new URLSearchParams(url.hash.substring(1));
  const accessToken = hashParams.get("access_token");
  const refreshToken = hashParams.get("refresh_token");

  if (!accessToken || !refreshToken) {
    throw new Error("No se recibieron credenciales de Google");
  }

  const { error: sessionError } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (sessionError) {
    throw new Error(sessionError.message);
  }

  // Ensure a profiles row exists for Google-authenticated users
  const { data: userData } = await supabase.auth.getUser();
  if (userData.user) {
    const meta = userData.user.user_metadata ?? {};
    const fullName: string = meta.full_name ?? meta.name ?? "";
    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0] ?? "";
    const lastName = nameParts.slice(1).join(" ") || null;

    await supabase.from("profiles").upsert({
      id: userData.user.id,
      email: userData.user.email ?? null,
      first_name: firstName,
      last_name: lastName,
    });
  }
}
