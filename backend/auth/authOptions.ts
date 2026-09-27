import dbConnect from "../config/dbConnect";
import User, { type IUser } from "../models/user";
import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

type AppToken = { user?: IUser };

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        await dbConnect({ throwOnError: true });
        if (!credentials?.email || !credentials?.password) return null;
        const email = credentials.email.trim().toLowerCase();
        const user = await User.findOne({ email }).select("+password").exec();
        if (
          !user ||
          user.accountStatus === "invited" ||
          user.accountStatus === "suspended" ||
          !(await bcrypt.compare(credentials.password, user.password))
        ) {
          throw new Error("Invalid email or password");
        }
        const safeUser = user.toObject();
        delete (safeUser as { password?: string }).password;
        return safeUser;
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user, trigger }) => {
      const appToken = token as typeof token & AppToken;
      if (user) appToken.user = user as unknown as IUser;
      if (trigger === "update" && appToken.user?._id) {
        await dbConnect({ throwOnError: true });
        const updatedUser = await User.findById(appToken.user._id).lean().exec();
        if (updatedUser) appToken.user = updatedUser as IUser;
      }
      return appToken;
    },
    session: async ({ session, token }) => {
      const appToken = token as typeof token & AppToken;
      if (appToken.user) session.user = appToken.user;
      return session;
    },
  },
  pages: { signIn: "/login" },
  secret: process.env.NEXTAUTH_SECRET,
};
