import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function noStoreFetch(input, init = {}) {
  return fetch(input, {
    ...init,
    cache: "no-store"
  });
}

const clientOptions = {
  auth: {
    autoRefreshToken: false,
    detectSessionInUrl: false,
    persistSession: false
  },
  global: {
    fetch: noStoreFetch
  }
};

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, clientOptions)
    : null;

export const supabaseAdmin =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey, clientOptions)
    : null;

export function getSupabaseClient() {
  if (!supabase) {
    throw new Error("डेटाबेस सेटिंग पूर्ण नाही.");
  }

  return supabase;
}

export function getSupabaseServerClient() {
  if (supabaseAdmin) {
    return supabaseAdmin;
  }

  return getSupabaseClient();
}
