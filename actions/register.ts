"use server";

import * as z from "zod";
import { RegisterSchema } from "@/form-schemas";
import { UserRole } from "@/models/typings";
import { supabaseAdmin } from "@/lib/supabase";

export const register = async (values: z.infer<typeof RegisterSchema>) => {
  const validatedFields = RegisterSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid Fields!" };
  }

  const { email, password, name } = validatedFields.data;

  // Create user in Supabase Auth.
  // We confirm email immediately to match the old flow (custom verification).
  // If you want email confirmation, set `email_confirm: false` and configure Supabase email templates.
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      name,
      role: UserRole.USER,
      isTwoFactorEnabled: false,
    },
  });

  if (error) {
    // Common case: duplicate email
    const msg = error.message?.toLowerCase?.() ?? "";
    if (msg.includes("already") || msg.includes("exists")) {
      return { error: "Email already being used" };
    }
    return { error: error.message };
  }

  if (!data.user) {
    return { error: "Failed to create user" };
  }

  return { success: "Account created! You can log in now." };
};
