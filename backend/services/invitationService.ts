import crypto from "crypto";
import { MerchantMember } from "../models/merchantIdentity";
import User from "../models/user";
import ErrorHandler from "../utils/errorHandler";
import { requirePassword, requireString } from "../utils/validation";

export const activateInvitation = async (rawToken: unknown, rawPassword: unknown) => {
  const token = requireString(rawToken, "Invitation token", 256);
  const password = requirePassword(rawPassword);
  if (password.length < 8) {
    throw new ErrorHandler("Password must be at least 8 characters", 400);
  }
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    invitationToken: tokenHash,
    invitationExpire: { $gt: new Date() },
    accountStatus: "invited",
  }).select("+invitationToken +invitationExpire +password");
  if (!user) throw new ErrorHandler("Invitation is invalid or has expired", 404);

  user.password = password;
  user.accountStatus = "active";
  user.invitationToken = undefined;
  user.invitationExpire = undefined;
  await user.save();
  await MerchantMember.updateMany(
    { userId: user._id, status: "invited" },
    { $set: { status: "active", joinedAt: new Date() } }
  );
  return { userId: user._id.toString(), email: user.email };
};
