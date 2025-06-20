import { client } from "@/sanity/lib/client";

export const getTwoFactorTokenByEmail = async (email: string) => {
  try {
    const twoFactorTokenQry = `*[_type == "twoFactorToken" && identifier == "${email}"][0]`;
    const twoFactorToken = await client.fetch(twoFactorTokenQry);

    return twoFactorToken;
  } catch (error) {
    console.error("Error fetching two-factor token by email:", error);
    return null;
  }
};

export const getTwoFactorTokenByToken = async (token: string) => {
  try {
    const twoFactorTokenQry = `*[_type == "twoFactorToken" && token == "${token}"][0]`;
    const twoFactorToken = await client.fetch(twoFactorTokenQry);

    return twoFactorToken;
  } catch (error) {
    console.error("Error fetching two-factor token by token:", error);
    return null;
  }
};
