import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { LoginSchema } from "./form-schemas";
import { UserRole } from "./models/typings";
import { supabaseAuth } from "@/lib/supabase";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
  //unstable update in Beta version
  unstable_update,
} = NextAuth({
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  providers: [
    Credentials({
      async authorize(credentials) {
        //if not using zod resolvers validated fields arent necessary
        const validatedFields = LoginSchema.safeParse(credentials);
        if (!validatedFields.success) return null;

        const { email, password } = validatedFields.data;

        const { data, error } = await supabaseAuth.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          console.error("[AUTH] Supabase signInWithPassword failed", {
            message: error.message,
            status: error.status,
            code: (error as any).code,
          });
          return null;
        }

        if (!data.user) {
          console.error("[AUTH] Supabase signInWithPassword returned no user");
          return null;
        }

        const meta = (data.user.user_metadata ?? {}) as Record<string, unknown>;
        const role =
          meta.role === UserRole.ADMIN || meta.role === UserRole.USER
            ? (meta.role as UserRole)
            : UserRole.USER;

        // NextAuth expects an object with an `id` field.
        // We use Supabase `user.id` to keep it stable across systems.
        return {
          id: data.user.id,
          email: data.user.email,
          name:
            typeof meta.name === "string"
              ? meta.name
              : (data.user.email ?? "User"),
          role,
          isTwoFactorEnabled: Boolean(meta.isTwoFactorEnabled),
          isOAuth: false,
        };
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 604800 },
  callbacks: {
    async signIn({ account }) {
      // For now we only support email/password via credentials.
      // (OAuth providers can be added later.)
      if (account?.provider && account.provider !== "credentials") return false;
      return true;
    },
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }

      if (token.role && session.user) {
        session.user.role = (token.role as UserRole) ?? UserRole.USER;
      }

      if (session.user) {
        session.user.isTwoFactorEnabled = token.isTwoFactorEnabled as boolean;
      }

      if (session.user) {
        session.user.name = token.name;
        if (token.email != null) {
          session.user.email = token.email;
        }
        session.user.isOAuth = token.isOAuth as boolean;
      }

      return session;
    },
    async jwt({ token, user }) {
      // On initial sign in, `user` is present — persist important fields into the JWT.
      if (user) {
        token.name = user.name;
        // @ts-expect-error NextAuth user type is provider-dependent
        token.email = user.email;
        // @ts-expect-error NextAuth user type is provider-dependent
        token.role = user.role ?? UserRole.USER;
        // @ts-expect-error NextAuth user type is provider-dependent
        token.isTwoFactorEnabled = Boolean(user.isTwoFactorEnabled);
        // @ts-expect-error NextAuth user type is provider-dependent
        token.isOAuth = Boolean(user.isOAuth);
      }

      return token;
    },
  },
});
