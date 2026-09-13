import mongoose from "mongoose";

type DbConnectOptions = {
  throwOnError?: boolean;
};

declare global {
  // eslint-disable-next-line no-var
  var mongoosePromise: Promise<typeof mongoose> | undefined;
}

const dbConnect = async (options: DbConnectOptions = {}) => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  const DB_URI = process.env.DB_URI || process.env.DB_LOCAL_URI;
  console.log("DB_URI:", DB_URI);
  if (!DB_URI) {
    const error = new Error("Database connection string (DATABASE_URI/DB_URI) is missing in .env");
    if (options.throwOnError) {
      throw error;
    }
    return;
  }

  if (!global.mongoosePromise) {
    global.mongoosePromise = mongoose.connect(DB_URI);
  }

  await global.mongoosePromise;
  console.log("DB Connected successfully to:", DB_URI.split("@")[1] || "Localhost");
};

export default dbConnect;
