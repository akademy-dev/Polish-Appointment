"use server";

import * as z from "zod";
import { LoginSchema } from "@/form-schemas";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { supabaseAdmin, supabaseAuth } from "@/lib/supabase";

export const login = async (values: z.infer<typeof LoginSchema>) => {
  const validatedFields = LoginSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid Fields!" };
  }

  const { email, password } = validatedFields.data;

  try {
    // Validate credentials directly against Supabase first
    // so we can surface the real error message to the UI.
    const { error: sbError } = await supabaseAuth.auth.signInWithPassword({
      email,
      password,
    });

    if (sbError) {
      // Don't log passwords; only log error metadata.
      console.error("[LOGIN] Supabase signInWithPassword failed", {
        email,
        message: sbError.message,
        status: sbError.status,
        code: (sbError as any).code,
      });

      // If the credentials are invalid, help the user understand whether the account exists.
      if ((sbError as any).code === "invalid_credentials") {
        try {
          const { data: usersData, error: listErr } =
            await supabaseAdmin.auth.admin.listUsers({
              page: 1,
              perPage: 1000,
            });

          if (!listErr && usersData?.users) {
            const exists = usersData.users.some(
              (u) => (u.email ?? "").toLowerCase() === email.toLowerCase()
            );

            return exists
              ? { error: "Wrong password. Please try again or reset password." }
              : {
                  error:
                    "Account not found in Supabase. Please register first (or migrate users).",
                };
          }
        } catch {
          // ignore – fall back to generic message
        }
      }

      return { error: sbError.message || "Invalid credentials!" };
    }

    // Then let NextAuth establish the app session.
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    return { success: "Login successful!" };
  } catch (error) {
    console.error("Login error:", error);
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid credentials!" };
        default:
          return { error: "Something went wrong" };
      }
    }
    throw error;
  }
};
