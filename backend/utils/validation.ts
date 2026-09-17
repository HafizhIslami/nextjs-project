import mongoose from "mongoose";
import ErrorHandler from "./errorHandler";

export const requireString = (
  value: unknown,
  field: string,
  maxLength = 5000
): string => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ErrorHandler(`${field} is required`, 400);
  }

  const normalized = value.trim();
  if (normalized.length > maxLength) {
    throw new ErrorHandler(`${field} is too long`, 400);
  }

  return normalized;
};

export const normalizeEmail = (value: unknown): string => {
  const email = requireString(value, "Email", 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ErrorHandler("Please enter a valid email", 400);
  }
  return email;
};

export const requirePassword = (value: unknown, field = "Password"): string => {
  const password = requireString(value, field, 128);
  if (password.length < 6) {
    throw new ErrorHandler(`${field} must be at least 6 characters`, 400);
  }
  return password;
};

export const requireObjectId = (value: unknown, field: string): string => {
  if (typeof value !== "string" || !mongoose.Types.ObjectId.isValid(value)) {
    throw new ErrorHandler(`Invalid ${field}`, 400);
  }
  return value;
};

export const parseStayDates = (
  checkInValue: unknown,
  checkOutValue: unknown
): { checkInDate: Date; checkOutDate: Date; daysOfStay: number } => {
  if (typeof checkInValue !== "string" || typeof checkOutValue !== "string") {
    throw new ErrorHandler("Check-in and check-out dates are required", 400);
  }

  const checkInDate = new Date(checkInValue);
  const checkOutDate = new Date(checkOutValue);

  if (
    Number.isNaN(checkInDate.getTime()) ||
    Number.isNaN(checkOutDate.getTime()) ||
    checkOutDate <= checkInDate
  ) {
    throw new ErrorHandler("Invalid booking dates", 400);
  }

  const daysOfStay = Math.ceil(
    (checkOutDate.getTime() - checkInDate.getTime()) / (24 * 60 * 60 * 1000)
  );

  if (!Number.isSafeInteger(daysOfStay) || daysOfStay < 1) {
    throw new ErrorHandler("Booking must be at least one day", 400);
  }

  return { checkInDate, checkOutDate, daysOfStay };
};

export const requireDate = (value: unknown, field: string): Date => {
  if (typeof value !== "string") {
    throw new ErrorHandler(`${field} is required`, 400);
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ErrorHandler(`Invalid ${field}`, 400);
  }

  return date;
};

export const requireImageDataUrl = (
  value: unknown,
  field = "Image",
  maxBytes = 5 * 1024 * 1024
): string => {
  if (typeof value !== "string") {
    throw new ErrorHandler(`${field} is invalid`, 400);
  }

  const match = value.match(
    /^data:image\/(?:jpeg|jpg|png|webp|gif);base64,([\s\S]+)$/
  );
  if (!match || !/^[A-Za-z0-9+/=\s]+$/.test(match[1])) {
    throw new ErrorHandler(`${field} must be a supported image`, 400);
  }

  const bytes = Math.ceil((match[1].replace(/\s/g, "").length * 3) / 4);
  if (bytes > maxBytes) {
    throw new ErrorHandler(`${field} exceeds the size limit`, 413);
  }

  return value;
};
