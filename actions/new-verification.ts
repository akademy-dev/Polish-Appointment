"use server";

import { supabaseAuth } from "@/lib/supabase";

export const newVerification = async (code: string) => {
  // Supabase email confirmation links include a `code` that can be exchanged.
  const { data, error } = await supabaseAuth.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return { error: "Invalid or expired verification link!" };
  }

  return { success: "Email verified!" };
};
