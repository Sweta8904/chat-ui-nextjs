// /types/next-auth.d.ts

import NextAuth, { DefaultSession } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";

// ✅ Extend Session properly (don't overwrite)
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

// ✅ Extend JWT properly
declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
  }
}