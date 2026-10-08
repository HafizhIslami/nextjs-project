import dbConnect from "@/backend/config/dbConnect";
import User, { IUser } from "@/backend/models/user";
import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { NextRequest } from "next/server";
import { enforceRateLimit } from "@/backend/utils/rateLimit";


type Token = {
  user: IUser;
};

type RouteHandlerContext = {
  params: { nextauth: string[] } | Promise<{ nextauth: string[] }>;
};

async function auth(req: NextRequest, res: RouteHandlerContext) {
  if (
    req.method === "POST" &&
    req.nextUrl.pathname.endsWith("/callback/credentials")
  ) {
    const rateLimitResponse = enforceRateLimit(req, "auth:login", {
      limit: 10,
      windowMs: 15 * 60 * 1000,
    });
    if (rateLimitResponse) return rateLimitResponse;
  }

  await dbConnect({ throwOnError: true });
  return await NextAuth(req, res, {
    session: {
      strategy: "jwt",
    },
    providers: [
      CredentialsProvider({
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" },
        },
        async authorize(credentials) {
          await dbConnect({ throwOnError: true });
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          const email = credentials.email.trim().toLowerCase();
          const password = credentials.password;
          const user = await User.findOne({ email }).select("+password").exec();

          if (!user) {
            throw new Error("Invalid email or password");
          }

          const isMatch = await bcrypt.compare(password, user.password);

          if (!isMatch) {
            throw new Error("Invalid email or password");
          }

          const safeUser = user.toObject();
          delete (safeUser as { password?: string }).password;
          return safeUser;
        },
      }),
    ],
    callbacks: {
      jwt: async ({ token, user }) => {
        const jwtToken = token as Token;
        if (user) {
          token.user = user;
        }

        if (req.url?.includes("/api/auth/session?update")) {
          const updatedUser = await User.findById(jwtToken?.user?._id).lean().exec();
          token.user = updatedUser;
        }

        return token;
      },
      session: async ({ session, token }) => {
        if (token) {
          session.user = token.user as IUser;
        }

        // console.log("session", session);
        // console.log("token", token);        
        return session;
      },
    },
    pages: {
      signIn: "/login",
    },
    secret: process.env.NEXTAUTH_SECRET,
  });
}

export { auth as GET, auth as POST };
export const dynamic = "force-dynamic";
