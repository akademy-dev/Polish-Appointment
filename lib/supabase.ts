import { createClient } from "@supabase/supabase-js";
import "server-only";

const supabaseUrl = process.env.SUPABASE_URL;
/**
 * NOTE:
 * - `SUPABASE_SERVICE_ROLE_KEY` should be used for server-side admin operations (bypasses RLS).
 * - `SUPABASE_ANON_KEY` should be used for end-user auth operations (sign in / sign up).
 *
 * This repo historically used `SUPABASE_KEY`; we keep it as a fallback to avoid breaking local envs.
 */
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  // Legacy/alternate naming seen in this repo's envs
  process.env.SUPABASE_SECRET_KEY ??
  process.env.SUPABASE_KEY;
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  // Common typo seen in envs (ANNON instead of ANON)
  process.env.SUPBASE_ANNON_KEY ??
  process.env.SUPABASE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing env.SUPABASE_URL");
}

if (!supabaseServiceRoleKey) {
  throw new Error(
    "Missing env.SUPABASE_SERVICE_ROLE_KEY (or fallback env.SUPABASE_SECRET_KEY / env.SUPABASE_KEY)"
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    "Missing env.SUPABASE_ANON_KEY (or fallback env.NEXT_PUBLIC_SUPABASE_ANON_KEY / env.SUPBASE_ANNON_KEY / env.SUPABASE_KEY)"
  );
}

// Server-side client with service role key for admin operations (data writes, admin user updates)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Server-side client using anon key for user auth operations (signInWithPassword, resetPasswordForEmail, etc.)
export const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Backward-compatible export used across data layer
export const supabase = supabaseAdmin;
