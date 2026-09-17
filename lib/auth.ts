import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { clearFailures, isRateLimited, recordFailure } from "./rate-limit";

const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000;

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Username and Password",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const username = String(credentials?.username ?? "").trim().toLowerCase();
        const password = String(credentials?.password ?? "");
        if (!username || !password) return null;

        const key = `login:${username}`;
        if (isRateLimited(key, MAX_ATTEMPTS, WINDOW_MS)) return null;

        const user = await prisma.user.findUnique({ where: { username } });
        const valid = user ? await bcrypt.compare(password, user.passwordHash) : false;
        if (!user || !valid) {
          recordFailure(key, WINDOW_MS);
          return null;
        }
        clearFailures(key);
        return { id: user.id, name: user.username };
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  secret: process.env.NEXTAUTH_SECRET,
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id;
        session.user.name = token.name ?? session.user.name;
      }
      return session;
    },
  },
};
