import ErrorHandler from "../utils/errorHandler";

export const calculateDuration = (
  startValue: unknown,
  endValue: unknown,
  unit: string | undefined
): { startAt: Date; endAt: Date; duration: number } => {
  const startAt = new Date(String(startValue));
  const endAt = new Date(String(endValue));
  if (!Number.isFinite(startAt.getTime()) || !Number.isFinite(endAt.getTime()) || endAt <= startAt) {
    throw new ErrorHandler("A valid reservation start and end time is required", 400);
  }

  const milliseconds = endAt.getTime() - startAt.getTime();
  const unitMs = unit === "hour"
    ? 60 * 60 * 1000
    : unit === "week"
      ? 7 * 24 * 60 * 60 * 1000
      : 24 * 60 * 60 * 1000;
  return { startAt, endAt, duration: Math.max(1, Math.ceil(milliseconds / unitMs)) };
};

export const calculateLineTotal = ({
  amountMinor,
  quantity,
  pricingModel,
  duration = 1,
}: {
  amountMinor: number;
  quantity: number;
  pricingModel: string;
  duration?: number;
}): number => {
  if (!Number.isSafeInteger(amountMinor) || amountMinor < 0) {
    throw new ErrorHandler("Invalid offering price", 400);
  }
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 10000) {
    throw new ErrorHandler("Invalid order quantity", 400);
  }
  const multiplier = pricingModel === "per_duration" ? duration : 1;
  const total = amountMinor * quantity * multiplier;
  if (!Number.isSafeInteger(total) || total < 0) {
    throw new ErrorHandler("Order total exceeds the supported range", 400);
  }
  return total;
};
