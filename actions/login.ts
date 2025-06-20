"use server";

import * as z from "zod";
import { LoginSchema } from "@/form-schemas";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";

import { getUserByEmail } from "@/data/user";
import { getTwoFactorTokenByEmail } from "@/data/two-factor-token";
import { getTwoFactorConfirmationByUserId } from "@/data/two-factor-confirmation";

import { sendVerificationEmail, sendTwoFactorTokenEmail } from "@/lib/mail";

import {
  generateVerificationToken,
  generateTwoFactorToken,
} from "@/lib/tokens";
import { client } from "@/sanity/lib/client";

export const login = async (values: z.infer<typeof LoginSchema>) => {
  const validatedFields = LoginSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid Fields!" };
  }

  const { email, password, code } = validatedFields.data;

  const existingUser = await getUserByEmail(email);

  if (!existingUser || !existingUser.email || !existingUser.password) {
    return { error: "Account does not exist!" };
  }

  if (!existingUser.emailVerified) {
    const verificationToken = await generateVerificationToken(
      existingUser.email,
    );
    //SEND EMAIL VERIFICATION TOKEN
    await sendVerificationEmail(
      verificationToken.identifier,
      verificationToken.token,
    );

    return { success: "Confirmation email sent!" };
  }

  if (existingUser.isTwoFactorEnabled && existingUser.email) {
    if (code) {
      const twoFactorToken = await getTwoFactorTokenByEmail(existingUser.email);

      if (!twoFactorToken) {
        return { error: "Invalid Code!" };
      }

      if (twoFactorToken.token !== code) {
        return { error: "Invalid Code!" };
      }

      const hasExpired = new Date(twoFactorToken.expires) < new Date();

      if (hasExpired) {
        return { error: "Code expired!" };
      }

      await client.delete(twoFactorToken._id);

      const existingConfirmation = await getTwoFactorConfirmationByUserId(
        existingUser._id,
      );

      if (existingConfirmation) {
        await client.delete(existingConfirmation._id);
      }

      await client.create({
        _type: "twoFactorConfirmation",
        userId: existingUser._id,
        user: {
          _type: "reference",
          _ref: existingUser._id,
        },
      });
    } else {
      const twoFactorToken = await generateTwoFactorToken(existingUser.email);
      await sendTwoFactorTokenEmail(
        twoFactorToken.identifier,
        twoFactorToken.token,
      );

      return { twoFactor: true };
    }
  }

  try {
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
