// import mongoose from "mongoose";

// type DbConnectOptions = {
//   throwOnError?: boolean;
// };

// declare global {
//   // eslint-disable-next-line no-var
//   var mongoosePromise: Promise<typeof mongoose> | undefined;
// }

// const dbConnect = async (options: DbConnectOptions = {}) => {
//   if (mongoose.connection.readyState >= 1) {
//     return;
//   }

//   const DB_URI = process.env.DB_URI || process.env.DB_LOCAL_URI;
//   console.log("DB_URI:", DB_URI);
//   if (!DB_URI) {
//     const error = new Error("Database connection string (DATABASE_URI/DB_URI) is missing in .env");
//     if (options.throwOnError) {
//       throw error;
//     }
//     return;
//   }

//   if (!global.mongoosePromise) {
//     global.mongoosePromise = mongoose.connect(DB_URI);
//   }

//   await global.mongoosePromise;
//   console.log("DB Connected successfully to:", DB_URI.split("@")[1] || "Localhost");
// };

// export default dbConnect;
import mongoose from "mongoose";

const DB_URI = process.env.DB_URI || process.env.DB_LOCAL_URI;

if (!DB_URI) {
  throw new Error("Database connection string (DB_URI) is missing in environment variables.");
}

// Menyiapkan cache di dalam global scope Node.js
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

const dbConnect = async () => {
  // 1. Jika sudah ada koneksi aktif, langsung return
  if (cached.conn) {
    return cached.conn;
  }

  // 2. Jika belum ada promise koneksi (atau promise sebelumnya error), buat promise baru
  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // JANGAN menahan query jika koneksi belum siap
      serverSelectionTimeoutMS: 5000, // Gagalkan koneksi setelah 5 detik jika IP terblokir (agar tidak perlu nunggu 10s Vercel limit)
    };

    cached.promise = mongoose.connect(DB_URI, opts).then((mongooseInstance) => {
      console.log("DB Connected successfully to:", DB_URI.split("@")[1] || "Localhost");
      return mongooseInstance;
    }).catch((err) => {
      // Jika gagal, RESET promise agar request berikutnya bisa mencoba koneksi ulang
      cached.promise = null;
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
};

export default dbConnect;