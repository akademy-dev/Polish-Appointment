"use server";

import { client } from "@/sanity/lib/client";
import { getUserByEmail } from "@/data/user";
import { getVerificationTokenByToken } from "@/data/verification-token";

export const newVerification = async (token: string) => {
  const existingToken = await getVerificationTokenByToken(token);

  if (!existingToken) {
    return { error: "Token does not exist!" };
  }

  const hasExpired = new Date(existingToken.expires) < new Date();

  if (hasExpired) {
    return { error: "Token has expired!" };
  }

  const existingUser = await getUserByEmail(existingToken.identifier);

  if (!existingUser) {
    return { error: "Email does not exist!" };
  }

  await client
    .patch(existingUser._id)
    .set({
      emailVerified: new Date().toISOString(),
      email: existingToken.identifier,
    })
    .commit();

  await client.delete(existingToken._id);

  return { success: "Email verified!" };
};
