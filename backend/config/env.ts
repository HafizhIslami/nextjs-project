import ErrorHandler from "../utils/errorHandler";

export const getRequiredEnv = (name: string): string => {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new ErrorHandler(`Missing required environment variable: ${name}`, 500);
  }

  return value;
};

