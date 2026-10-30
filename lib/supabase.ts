import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * The Supabase project that holds shows, accounts, friends, notes and "going".
 * Both values are public by design (the anon key only allows what the database rules allow).
 * Leave them empty and the site runs without accounts, on the Google Sheet or sample data.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
export const supabaseConfigured = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

let client: SupabaseClient | null = null;

/** The browser client, created on first use. Returns null when Supabase isn't configured. */
export function sb(): SupabaseClient | null {
  if (!supabaseConfigured) return null;
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { flowType: "pkce", persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: "taw-auth" }
    });
  }
  return client;
}
