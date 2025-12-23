"use server";

import * as z from "zod";

import { NewPasswordSchema } from "@/form-schemas";
import { supabaseAdmin, supabaseAuth } from "@/lib/supabase";

export const newPassword = async (
  values: z.infer<typeof NewPasswordSchema>,
  code?: string | null
) => {
  if (!code) {
    return { error: "Missing code!" };
  }

  const validatedFields = NewPasswordSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields!" };
  }

  const { password } = validatedFields.data;

  // Supabase sends recovery links that include an OAuth-style `code` (PKCE flow).
  // We exchange the code to validate it and retrieve the user, then update the password via admin API.
  const { data, error } = await supabaseAuth.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    return { error: "Invalid or expired link!" };
  }

  const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(
    data.user.id,
    { password }
  );
  if (updateErr) {
    return { error: updateErr.message };
  }

  return { success: "Password updated!" };
};
