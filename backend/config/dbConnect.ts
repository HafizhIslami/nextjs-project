import mongoose from "mongoose";

type DbConnectOptions = {
  throwOnError?: boolean;
};

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

const dbConnect = async (options: DbConnectOptions = {}) => {
  // 1. Jika sudah ada koneksi aktif, langsung return
  if (mongoose.connection.readyState >= 1 && cached.conn) {
    return cached.conn;
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

  // 2. Jika belum ada promise koneksi (atau promise sebelumnya error), buat koneksi baru
  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Menghindari query menggantung di serverless
      serverSelectionTimeoutMS: 5000, // Timeout dalam 5 detik jika IP terblokir
    };

    cached.promise = mongoose
      .connect(DB_URI, opts)
      .then((mongooseInstance) => {
        console.log(
          "DB Connected successfully to:",
          DB_URI.split("@")[1] || "Localhost"
        );
        return mongooseInstance;
      })
      .catch((err) => {
        cached.promise = null; // Reset promise jika gagal
        console.error("Failed to connect to DB:", err.message);
        throw err; // Lempar error agar tipe Promise tetap valid
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    if (options.throwOnError) {
      throw e;
    }
  }

  return cached.conn;
};

export default dbConnect;