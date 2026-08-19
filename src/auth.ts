import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { getPool } from "@/lib/db";
import { upsertPlayerFromGoogle, verifyPlayerCredentials } from "@/lib/players";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    Credentials({
      name: "Site credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const username =
          typeof credentials?.username === "string"
            ? credentials.username.trim()
            : "";
        const password =
          typeof credentials?.password === "string"
            ? credentials.password
            : "";
        if (!username || !password) {
          return null;
        }

        const pool = getPool();
        const player = await verifyPlayerCredentials(pool, username, password);
        if (!player) {
          return null;
        }

        return {
          id: String(player.Player_ID),
          email: player.Player_Email,
          name: player.Player_Name,
          playerId: player.Player_ID,
          playerName: player.Player_Name,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 180,
  },
  callbacks: {
    async jwt({ token, account, profile, user }) {
      if (user && "playerId" in user && typeof user.playerId === "number") {
        token.playerId = user.playerId;
        token.playerName =
          typeof user.playerName === "string" ? user.playerName : undefined;
        return token;
      }

      if (account && profile?.email) {
        const name =
          (typeof profile.name === "string" && profile.name) ||
          profile.email.split("@")[0] ||
          "Player";
        const pool = getPool();
        const player = await upsertPlayerFromGoogle(pool, {
          email: profile.email,
          name,
        });
        token.playerId = player.Player_ID;
        token.playerName = player.Player_Name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.playerId =
          typeof token.playerId === "number" ? token.playerId : undefined;
        session.user.playerName =
          typeof token.playerName === "string"
            ? token.playerName
            : undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
