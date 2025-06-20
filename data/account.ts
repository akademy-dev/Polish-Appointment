import { client } from "@/sanity/lib/client";

export const getAccountByUserId = async (userId: string) => {
  try {
    // Fetch user by ID
    const accountQry = `*[_type == "account" && userId == "${userId}"][0]`;
    return await client.fetch(accountQry);
  } catch {
    return null;
  }
};
