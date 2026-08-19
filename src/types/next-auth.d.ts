import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    playerId?: number;
    playerName?: string;
  }

  interface Session {
    user: DefaultSession["user"] & {
      playerId?: number;
      playerName?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    playerId?: number;
    playerName?: string;
  }
}
