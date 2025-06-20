import type { CredentialsConfig } from "next-auth/providers";
import Credentials from "next-auth/providers/credentials";
import type { SanityClient } from "@sanity/client";
import bcrypt from "bcryptjs";

import { LoginSchema } from "@/form-schemas";

export const SanityCredentials = (
  sanityClient: SanityClient,
): CredentialsConfig =>
  Credentials({
    name: "Credentials",
    id: "sanity-login",
    type: "credentials",
    credentials: {
      email: {
        label: "Email",
        type: "text",
      },
      password: {
        label: "Password",
        type: "password",
      },
    },

    async authorize(credentials) {
      //if not using zod resolvers validated fields arent necessary
      const validatedFields = LoginSchema.safeParse(credentials);
      if (!validatedFields.success) return null;

      const user_qry = `*[_type == "user" && email== "${credentials?.email}"][0]`;
      const user = await sanityClient.fetch(user_qry);

      if (!user || !user.password) return null;

      const passwordsMatch = await bcrypt.compare(
        credentials?.password as string,
        user.password,
      );

      if (passwordsMatch) {
        return {
          id: user._id,
          ...user,
        };
      }

      return null;
    },
  });
