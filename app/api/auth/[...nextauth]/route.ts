import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

const handler = NextAuth({
  providers: [
    // 🔐 EMAIL + PASSWORD LOGIN
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        try {
          await connectDB();

          const user = await User.findOne({
            email: credentials?.email,
          });

          if (!user || !user.passwordHash) return null;

          const isValid = await bcrypt.compare(
            credentials!.password,
            user.passwordHash
          );

          if (!isValid) return null;

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
          };
        } catch (error) {
          console.error("Credentials Auth Error:", error);
          return null;
        }
      },
    }),

    // 🌐 GOOGLE LOGIN
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    // 🌐 GITHUB LOGIN
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    // 🔥 Runs on login (OAuth + credentials)
    async signIn({ user, account }) {
      try {
        await connectDB();

        if (!user.email) return false;

        const existingUser = await User.findOne({
          email: user.email,
        });

        if (!existingUser) {
          await User.create({
            email: user.email,
            name: user.name || "",
            image: user.image || "",
            provider: account?.provider || "credentials",
          });
        }

        return true;
      } catch (error) {
        console.error("SignIn Error:", error);
        return false;
      }
    },

    // 🔥 Attach user ID to token
    async jwt({ token }) {
      try {
        if (!token.email) return token;

        await connectDB();

        const dbUser = await User.findOne({
          email: token.email,
        });

        if (dbUser) {
          token.id = dbUser._id.toString();
        }

        return token;
      } catch (error) {
        console.error("JWT Error:", error);
        return token;
      }
    },

    // 🔥 Attach ID to session
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }

      return session;
    },
  },

  pages: {
    signIn: "/login",
  },

  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };