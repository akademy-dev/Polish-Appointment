import { client } from "@/sanity/lib/client";

export const getTwoFactorConfirmationByUserId = async (userId: string) => {
  try {
    const twoFactorConfirmationQry = `*[_type == "twoFactorConfirmation" && userId == "${userId}"][0]`;
    const twoFactorConfirmation = await client.fetch(twoFactorConfirmationQry);

    return twoFactorConfirmation;
  } catch (error) {
    console.error("Error fetching two-factor confirmation by user ID:", error);
    return null;
  }
};
