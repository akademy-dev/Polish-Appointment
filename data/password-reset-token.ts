import { client } from "@/sanity/lib/client";

export const getPasswordResetTokenByEmail = async (email: string) => {
  try {
    const passResetTokenQry = `*[_type == "passwordResetToken" && identifier == "${email}"][0]`;
    const passResetToken = await client.fetch(passResetTokenQry);

    return passResetToken;
  } catch (error) {
    console.error("Error fetching password reset token by email:", error);
    return null;
  }
};

export const getPasswordResetTokenByToken = async (token: string) => {
  try {
    const passResetTokenQry = `*[_type == "passwordResetToken" && token == "${token}"][0]`;
    const passResetToken = await client.fetch(passResetTokenQry);

    return passResetToken;
  } catch (error) {
    console.error("Error fetching password reset token by token:", error);
    return null;
  }
};
