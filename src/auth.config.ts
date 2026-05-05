import type { NextAuthConfig } from "next-auth";

/**
 * Middleware-safe auth config — no Prisma/bcrypt/server-only imports.
 * `src/lib/auth.ts` merges this with the Credentials provider.
 */
export const authConfig = {
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET,
  providers: [],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user?.id) token.uid = user.id as string;
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user && token.uid) {
        (session.user as { id?: string }).id = token.uid as string;
      }
      return session;
    },
    authorized: async ({ auth, request }) => {
      const { pathname } = request.nextUrl;
      const protectedRoutes = [
        "/dashboard",
        "/automations",
        "/posts",
        "/analytics",
        "/settings",
      ];
      const isProtected = protectedRoutes.some((p) => pathname.startsWith(p));
      if (isProtected) return !!auth;
      return true;
    },
  },
} satisfies NextAuthConfig;
