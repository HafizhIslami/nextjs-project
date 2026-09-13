import mongoose from "mongoose";

export type DbConnectOptions = {
  throwOnError?: boolean;
};

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var mongooseCache: MongooseCache | undefined;
}

let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

const dbConnect = async (
  options: DbConnectOptions = {}
): Promise<typeof mongoose | undefined> => {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  // Do not reuse a connection object after the driver has disconnected.
  if (mongoose.connection.readyState === 0) {
    cached.conn = null;
  }

  const DB_URI = process.env.DB_URI || process.env.DB_LOCAL_URI;

  if (!DB_URI) {
    const error = new Error(
      "Database connection string (DATABASE_URI/DB_URI) is missing in .env"
    );
    if (options.throwOnError) {
      throw error;
    }
    console.error(error.message);
    return;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(DB_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    }).then((mongooseInstance) => {
      console.log(
        "DB Connected successfully to:",
        DB_URI.split("@")[1] || "Localhost"
      );
      return mongooseInstance;
    }).catch((error: unknown) => {
      // A rejected promise must not be cached across warm invocations.
      cached.promise = null;
      cached.conn = null;
      throw error;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error: unknown) {
    cached.promise = null;
    cached.conn = null;

    if (options.throwOnError) {
      throw error;
    }

    console.error(
      "Failed to connect to DB:",
      error instanceof Error ? error.message : error
    );
    return undefined;
  }
};

export default dbConnect;
