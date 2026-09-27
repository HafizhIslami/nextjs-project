import mongoose from "mongoose";
import { PlatformMember } from "../backend/models/platform";
import User from "../backend/models/user";
import {
  buildInvitationUrl,
  provisionMerchant,
} from "../backend/services/merchantProvisioningService";

const required = (name: string) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}`);
  return value;
};

const main = async () => {
  const uri = process.env.DB_URI?.trim() || process.env.DB_LOCAL_URI?.trim() || required("DB_URI");
  await mongoose.connect(uri);
  const platformOwnerEmail = required("PLATFORM_OWNER_EMAIL").toLowerCase();
  const platformOwner = await User.findOne({ email: platformOwnerEmail }).lean().exec();
  if (!platformOwner) throw new Error("PLATFORM_OWNER_EMAIL does not match an existing user");
  const platformMembership = await PlatformMember.findOne({
    userId: platformOwner._id,
    role: { $in: ["owner", "admin"] },
    status: "active",
  }).lean().exec();
  if (!platformMembership) throw new Error("Run npm run platform:bootstrap before creating merchants");

  const merchantCode = required("NEW_MERCHANT_CODE");
  const result = await provisionMerchant(
    {
      merchantCode,
      name: required("NEW_MERCHANT_NAME"),
      ownerName: process.env.NEW_MERCHANT_OWNER_NAME,
      ownerEmail: required("NEW_MERCHANT_OWNER_EMAIL"),
      businessType: process.env.NEW_MERCHANT_BUSINESS_TYPE || "general",
      currency: process.env.NEW_MERCHANT_CURRENCY || "IDR",
      locale: process.env.NEW_MERCHANT_LOCALE || "id-ID",
      timezone: process.env.NEW_MERCHANT_TIMEZONE || "Asia/Jakarta",
      channels: ["retail", "reseller"],
      idempotencyKey: process.env.NEW_MERCHANT_IDEMPOTENCY_KEY || `cli:${merchantCode}`,
    },
    {
      userId: platformOwner._id.toString(),
      role: platformMembership.role as "owner" | "admin",
    }
  );

  console.log(JSON.stringify({
    merchantId: result.merchant._id.toString(),
    merchantCode: result.merchant.merchantCode,
    hostname: result.domain?.hostname,
    reused: result.reused,
    ownerInvited: result.ownerInvited,
    activationUrl: result.invitationToken ? buildInvitationUrl(result.invitationToken) : undefined,
  }, null, 2));
};

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => mongoose.disconnect());

