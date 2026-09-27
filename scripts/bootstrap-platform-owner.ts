import mongoose from "mongoose";
import { PlatformMember } from "../backend/models/platform";
import User from "../backend/models/user";
import { writePlatformAudit } from "../backend/platform/audit";

const value = (name: string) => process.env[name]?.trim();

const main = async () => {
  const uri = value("DB_URI") || value("DB_LOCAL_URI");
  if (!uri) throw new Error("DB_URI or DB_LOCAL_URI is required");
  await mongoose.connect(uri);

  let ownerEmail = value("PLATFORM_OWNER_EMAIL")?.toLowerCase();
  let user = ownerEmail ? await User.findOne({ email: ownerEmail }).exec() : null;

  if (!user && !ownerEmail && process.env.PLATFORM_BOOTSTRAP_ALLOW_SINGLE_ADMIN === "true") {
    const admins = await User.find({ role: "admin", accountStatus: { $ne: "suspended" } }).limit(2).exec();
    if (admins.length === 1) {
      user = admins[0];
      ownerEmail = user.email;
      console.log("Using the only active legacy admin as the local platform owner.");
    }
  }

  if (!user && ownerEmail) {
    const password = value("PLATFORM_OWNER_PASSWORD");
    if (!password || password.length < 8) {
      throw new Error("The platform owner user does not exist. Set PLATFORM_OWNER_PASSWORD to at least 8 characters for initial creation.");
    }
    user = await User.create({
      name: value("PLATFORM_OWNER_NAME") || "Platform Owner",
      email: ownerEmail,
      password,
      role: "user",
      accountStatus: "active",
    });
  }

  if (!user) {
    throw new Error("Set PLATFORM_OWNER_EMAIL, or enable local single-admin discovery when exactly one admin exists.");
  }

  const otherOwner = await PlatformMember.findOne({
    role: "owner",
    status: "active",
    userId: { $ne: user._id },
  }).lean().exec();
  if (otherOwner && process.env.PLATFORM_ALLOW_ADDITIONAL_OWNER !== "true") {
    throw new Error("Another active platform owner already exists. Set PLATFORM_ALLOW_ADDITIONAL_OWNER=true only after reviewing that account.");
  }

  const membership = await PlatformMember.findOneAndUpdate(
    { userId: user._id },
    {
      $set: {
        role: "owner",
        status: "active",
        mfaRequired: process.env.PLATFORM_REQUIRE_MFA === "true",
      },
      $setOnInsert: { permissions: [] },
    },
    { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true }
  );
  await writePlatformAudit({
    actorUserId: user._id.toString(),
    actorRole: "owner",
    action: "platform.owner_bootstrapped",
    targetType: "platform_member",
    targetId: membership._id.toString(),
    changes: { email: user.email },
  });
  console.log(`Platform owner is ready: ${user.email}`);
};

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => mongoose.disconnect());

