import dbConnect from "@/backend/config/dbConnect";
import User, { IUser } from "@/backend/models/user";
import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { NextRequest } from "next/server";


type Credentials = {
  email: string;
  password: string;
};

type Token = {
  user: IUser;
};

async function auth(req: NextRequest, res: any) {
  return await NextAuth(req, res, {
    session: {
      strategy: "jwt",
    },
    providers: [
      CredentialsProvider({
        // @ts-ignore
        async authorize(credentials: Credentials) {
          dbConnect();

          const { email, password } = credentials;
          const user = await User.findOne({ email }).select("+password");

          if (!user) {
            throw new Error("Invalid email or password");
          }

          const isMatch = await bcrypt.compare(password, user.password);

          if (!isMatch) {
            throw new Error("Invalid email or password");
          }

          return user;
        },
      }),
    ],
    callbacks: {
      jwt: async ({ token, user }) => {
        const jwtToken = token as Token;
        user && (token.user = user);

        if (req.url?.includes("/api/auth/session?update")) {
          const updatedUser = await User.findById(jwtToken?.user?._id);
          token.user = updatedUser;
        }

        return token;
      },
      session: async ({ session, token }) => {
        token && (session.user = token.user as IUser);

        // @ts-ignore
        delete session?.user?.password;
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
