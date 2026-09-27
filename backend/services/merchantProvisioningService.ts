import crypto from "crypto";
import mongoose from "mongoose";
import { Channel, PriceList } from "../models/catalog";
import Merchant, { MerchantDomain } from "../models/merchant";
import { MerchantMember } from "../models/merchantIdentity";
import User from "../models/user";
import { RESERVED_MERCHANT_CODES, normalizeHostname } from "../tenancy/hostname";
import ErrorHandler from "../utils/errorHandler";
import { normalizeEmail, requireString } from "../utils/validation";
import { writePlatformAudit } from "../platform/audit";
import type { NextRequest } from "next/server";

const MERCHANT_CODE = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const COLOR = /^#[0-9a-f]{6}$/i;
const ALLOWED_MODULES = new Set(["catalog", "commerce", "inventory", "rental", "quotation"]);
const ALLOWED_BUSINESS_TYPES = new Set([
  "general",
  "physical-products",
  "services",
  "rental-reservation",
  "accommodation",
]);

export type ProvisionMerchantInput = {
  merchantCode: unknown;
  name: unknown;
  legalName?: unknown;
  ownerName?: unknown;
  ownerEmail: unknown;
  businessType?: unknown;
  currency?: unknown;
  locale?: unknown;
  timezone?: unknown;
  modules?: unknown;
  channels?: unknown;
  primaryColor?: unknown;
  secondaryColor?: unknown;
  accentColor?: unknown;
  idempotencyKey: unknown;
};

type ProvisionActor = { userId: string; role: "owner" | "admin"; request?: NextRequest };

const invitationToken = () => {
  const token = crypto.randomBytes(32).toString("hex");
  return {
    token,
    hash: crypto.createHash("sha256").update(token).digest("hex"),
    expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
  };
};

const cleanColor = (value: unknown, fallback: string) =>
  typeof value === "string" && COLOR.test(value) ? value.toLowerCase() : fallback;

const normalizeModules = (value: unknown, businessType: string): string[] => {
  const requested = Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && ALLOWED_MODULES.has(item))
    : [];
  if (requested.length) return Array.from(new Set(["catalog", ...requested]));
  if (businessType === "services") return ["catalog", "commerce", "quotation"];
  if (["rental-reservation", "accommodation"].includes(businessType)) {
    return ["catalog", "commerce", "rental"];
  }
  return ["catalog", "commerce", "inventory"];
};

const normalizeChannels = (value: unknown): Array<"retail" | "reseller"> => {
  if (!Array.isArray(value)) return ["retail", "reseller"];
  const selected = value.filter(
    (item): item is "retail" | "reseller" => item === "retail" || item === "reseller"
  );
  return selected.length ? Array.from(new Set(selected)) : ["retail"];
};

export const buildInvitationUrl = (token: string) => {
  const root =
    process.env.PLATFORM_CONSOLE_URL?.trim() ||
    process.env.API_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    "http://localhost:3000";
  return `${root.replace(/\/$/, "")}/activate/${token}`;
};

export const createOwnerInvitation = async (userId: string) => {
  const invitation = invitationToken();
  const user = await User.findOneAndUpdate(
    { _id: userId, accountStatus: "invited" },
    {
      $set: {
        invitationToken: invitation.hash,
        invitationExpire: invitation.expiresAt,
      },
    },
    { returnDocument: "after" }
  );
  if (!user) throw new ErrorHandler("Only invited accounts can receive an activation link", 409);
  return { token: invitation.token, expiresAt: invitation.expiresAt };
};

export const provisionMerchant = async (
  raw: ProvisionMerchantInput,
  actor: ProvisionActor
) => {
  const merchantCode = requireString(raw.merchantCode, "Merchant code", 63).toLowerCase();
  if (!MERCHANT_CODE.test(merchantCode) || RESERVED_MERCHANT_CODES.has(merchantCode)) {
    throw new ErrorHandler("Merchant code is invalid or reserved", 400);
  }
  const name = requireString(raw.name, "Merchant name", 120);
  const ownerEmail = normalizeEmail(raw.ownerEmail);
  const ownerName = typeof raw.ownerName === "string" && raw.ownerName.trim()
    ? requireString(raw.ownerName, "Owner name", 120)
    : ownerEmail.split("@")[0];
  const businessType =
    typeof raw.businessType === "string" && ALLOWED_BUSINESS_TYPES.has(raw.businessType)
      ? raw.businessType
      : "general";
  const currency = typeof raw.currency === "string" ? raw.currency.trim().toUpperCase() : "IDR";
  if (!/^[A-Z]{3}$/.test(currency)) throw new ErrorHandler("Currency must be a three-letter code", 400);
  const locale = typeof raw.locale === "string" && raw.locale.trim() ? raw.locale.trim() : "id-ID";
  const timezone = typeof raw.timezone === "string" && raw.timezone.trim() ? raw.timezone.trim() : "Asia/Jakarta";
  const modules = normalizeModules(raw.modules, businessType);
  const channels = normalizeChannels(raw.channels);
  const idempotencyKey = requireString(raw.idempotencyKey, "Idempotency key", 200);
  const rootDomain = normalizeHostname(process.env.PLATFORM_ROOT_DOMAIN || "localhost");
  if (!rootDomain) throw new ErrorHandler("PLATFORM_ROOT_DOMAIN is not configured", 500);
  const hostname = `${merchantCode}.${rootDomain}`;

  const replay = await Merchant.findOne({ provisioningKey: idempotencyKey })
    .select("+provisioningKey")
    .lean()
    .exec();
  if (replay) {
    const domain = await MerchantDomain.findOne({ merchantId: replay._id, isPrimary: true }).lean().exec();
    return { merchant: replay, domain, reused: true, ownerInvited: false };
  }

  if (await Merchant.exists({ merchantCode })) {
    throw new ErrorHandler("Merchant code is already in use", 409);
  }
  if (await MerchantDomain.exists({ hostname })) {
    throw new ErrorHandler("Merchant hostname is already in use", 409);
  }

  let merchantId: mongoose.Types.ObjectId | undefined;
  let createdUserId: mongoose.Types.ObjectId | undefined;
  try {
    let owner = await User.findOne({ email: ownerEmail }).exec();
    let ownerInvited = false;
    let rawInvitationToken: string | undefined;
    if (!owner) {
      const invitation = invitationToken();
      owner = await User.create({
        name: ownerName,
        email: ownerEmail,
        password: crypto.randomBytes(32).toString("base64url"),
        role: "user",
        accountStatus: "invited",
        invitationToken: invitation.hash,
        invitationExpire: invitation.expiresAt,
      });
      createdUserId = owner._id;
      ownerInvited = true;
      rawInvitationToken = invitation.token;
    } else if (owner.accountStatus === "suspended") {
      throw new ErrorHandler("The selected owner account is suspended", 409);
    } else if (owner.accountStatus === "invited") {
      const invitation = invitationToken();
      owner.invitationToken = invitation.hash;
      owner.invitationExpire = invitation.expiresAt;
      await owner.save();
      ownerInvited = true;
      rawInvitationToken = invitation.token;
    }

    const merchant = await Merchant.create({
      merchantCode,
      name,
      legalName: typeof raw.legalName === "string" ? raw.legalName.trim() || undefined : undefined,
      status: "active",
      businessType,
      branding: {
        primaryColor: cleanColor(raw.primaryColor, "#a7194b"),
        secondaryColor: cleanColor(raw.secondaryColor, "#23191f"),
        accentColor: cleanColor(raw.accentColor, "#f6dce6"),
      },
      settings: {
        currency,
        locale,
        timezone,
        taxEnabled: false,
        pricesIncludeTax: true,
        guestCheckoutEnabled: false,
      },
      enabledModules: modules,
      provisioningKey: idempotencyKey,
      createdByPlatformUserId: actor.userId,
    });
    merchantId = merchant._id;

    const domain = await MerchantDomain.create({
      merchantId,
      hostname,
      type: "platform_subdomain",
      isPrimary: true,
      status: "active",
      sslStatus: rootDomain === "localhost" ? "active" : "pending",
    });
    await MerchantMember.create({
      merchantId,
      userId: owner._id,
      role: "owner",
      status: ownerInvited ? "invited" : "active",
      permissions: [],
      invitedBy: actor.userId,
      joinedAt: ownerInvited ? undefined : new Date(),
    });

    for (const channelCode of channels) {
      const isReseller = channelCode === "reseller";
      const priceList = await PriceList.create({
        merchantId,
        code: `${channelCode}-default`,
        name: `${isReseller ? "Reseller" : "Retail"} pricing`,
        currency,
        status: "active",
      });
      await Channel.create({
        merchantId,
        code: channelCode,
        name: isReseller ? "Reseller" : "Retail",
        type: channelCode,
        status: "active",
        visibility: isReseller ? "private" : "public",
        defaultPriceListId: priceList._id,
        rules: {
          requireLogin: isReseller,
          requireApproval: isReseller,
          allowGuestCheckout: false,
          allowBackorder: false,
          allowedPaymentMethods: ["stripe"],
        },
      });
    }

    await writePlatformAudit({
      actorUserId: actor.userId,
      actorRole: actor.role,
      action: "merchant.provisioned",
      targetType: "merchant",
      targetId: merchant._id.toString(),
      merchantId: merchant._id.toString(),
      changes: { merchantCode, hostname, ownerEmail, modules, channels },
      request: actor.request,
    });

    return {
      merchant: merchant.toObject(),
      domain: domain.toObject(),
      reused: false,
      ownerInvited,
      invitationToken: rawInvitationToken,
      owner: { id: owner._id.toString(), email: owner.email, name: owner.name },
    };
  } catch (error) {
    if (merchantId) {
      await Promise.all([
        Channel.deleteMany({ merchantId }),
        PriceList.deleteMany({ merchantId }),
        MerchantMember.deleteMany({ merchantId }),
        MerchantDomain.deleteMany({ merchantId }),
      ]);
      await Merchant.deleteOne({ _id: merchantId });
    }
    if (createdUserId) await User.deleteOne({ _id: createdUserId, accountStatus: "invited" });
    throw error;
  }
};
