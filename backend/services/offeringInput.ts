import ErrorHandler from "../utils/errorHandler";
import { requireString } from "../utils/validation";

const OFFERING_TYPES = ["physical", "service", "rental", "custom"] as const;
const PRICING_MODELS = ["fixed", "per_unit", "per_duration", "quote"] as const;
const INVENTORY_MODES = ["none", "stock", "capacity", "calendar"] as const;

export const toSlug = (value: string): string =>
  value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);

export const parseOfferingInput = (
  body: unknown,
  defaultCurrency: string
): Record<string, unknown> => {
  if (!body || typeof body !== "object") {
    throw new ErrorHandler("Invalid offering payload", 400);
  }

  const input = body as Record<string, unknown>;
  const name = requireString(input.name, "Offering name", 200);
  const code = requireString(input.code, "Offering code", 80).toUpperCase();
  const description = requireString(input.description, "Description", 20000);
  const slug = toSlug(typeof input.slug === "string" ? input.slug : name);
  if (!slug) throw new ErrorHandler("Offering slug is invalid", 400);

  const type = input.type;
  if (!OFFERING_TYPES.includes(type as (typeof OFFERING_TYPES)[number])) {
    throw new ErrorHandler("Invalid offering type", 400);
  }

  const rawPricing = input.pricing && typeof input.pricing === "object"
    ? input.pricing as Record<string, unknown>
    : {};
  const pricingModel = rawPricing.model;
  if (!PRICING_MODELS.includes(pricingModel as (typeof PRICING_MODELS)[number])) {
    throw new ErrorHandler("Invalid pricing model", 400);
  }

  const amount = rawPricing.baseAmountMinor === undefined || rawPricing.baseAmountMinor === ""
    ? undefined
    : Number(rawPricing.baseAmountMinor);
  if (pricingModel !== "quote" && (!Number.isSafeInteger(amount) || (amount ?? -1) < 0)) {
    throw new ErrorHandler("Price must be a non-negative integer in the smallest currency unit", 400);
  }

  const rawInventory = input.inventory && typeof input.inventory === "object"
    ? input.inventory as Record<string, unknown>
    : {};
  const inventoryMode = rawInventory.mode || "none";
  if (!INVENTORY_MODES.includes(inventoryMode as (typeof INVENTORY_MODES)[number])) {
    throw new ErrorHandler("Invalid inventory mode", 400);
  }

  const media = Array.isArray(input.media)
    ? input.media.slice(0, 20).map((item, index) => {
        if (!item || typeof item !== "object") {
          throw new ErrorHandler(`Media ${index + 1} is invalid`, 400);
        }
        const mediaItem = item as Record<string, unknown>;
        return {
          type: mediaItem.type === "video" || mediaItem.type === "document" ? mediaItem.type : "image",
          publicId: typeof mediaItem.publicId === "string" ? mediaItem.publicId : undefined,
          url: requireString(mediaItem.url, `Media ${index + 1} URL`, 2000),
          alt: typeof mediaItem.alt === "string" ? mediaItem.alt.slice(0, 300) : name,
          sortOrder: index,
        };
      })
    : [];

  const status = input.status === "active" || input.status === "archived"
    ? input.status
    : "draft";

  return {
    code,
    slug,
    name,
    shortDescription: typeof input.shortDescription === "string"
      ? input.shortDescription.trim().slice(0, 300)
      : undefined,
    description,
    type,
    status,
    media,
    pricing: {
      model: pricingModel,
      baseAmountMinor: amount,
      currency: typeof rawPricing.currency === "string"
        ? rawPricing.currency.toUpperCase().slice(0, 3)
        : defaultCurrency,
      unit: typeof rawPricing.unit === "string" ? rawPricing.unit.slice(0, 40) : undefined,
      durationUnit: ["hour", "day", "night", "week"].includes(String(rawPricing.durationUnit))
        ? rawPricing.durationUnit
        : undefined,
    },
    inventory: {
      mode: inventoryMode,
      trackInventory: rawInventory.trackInventory === true,
      allowBackorder: rawInventory.allowBackorder === true,
    },
    attributes: Array.isArray(input.attributes) ? input.attributes.slice(0, 100) : [],
    variants: Array.isArray(input.variants) ? input.variants.slice(0, 100) : [],
    physicalConfig: type === "physical" ? input.physicalConfig : undefined,
    serviceConfig: type === "service" ? input.serviceConfig : undefined,
    rentalConfig: type === "rental" ? input.rentalConfig : undefined,
    customConfig: type === "custom" ? input.customConfig : undefined,
  };
};
