"use server";

import * as z from "zod";

import { ResetSchema } from "@/form-schemas";
import { supabaseAuth } from "@/lib/supabase";

export const reset = async (values: z.infer<typeof ResetSchema>) => {
  const validatedFields = ResetSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid emaiL!" };
  }

  const { email } = validatedFields.data;

  const domain = process.env.NEXT_PUBLIC_DOMAIN || "http://localhost:3000";
  const { error } = await supabaseAuth.auth.resetPasswordForEmail(email, {
    redirectTo: `${domain}/auth/new-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: "Reset password email sent!" };
};
