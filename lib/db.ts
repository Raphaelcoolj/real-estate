/* ---------------------------------------------------------------------------
 * MongoDB connection — singleton with a global cache so dev-mode HMR reuses
 * the same connection instead of exhausting the pool.
 * ------------------------------------------------------------------------ */

import mongoose from "mongoose";

/* Read lazily so scripts that call `loadEnvConfig()` after imports still
 * connect to the configured database rather than the fallback. */
function mongoUri(): string {
  return process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/arcadia";
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

const globalWithMongoose = global as typeof globalThis & {
  __mongoose?: MongooseCache;
};

const cache: MongooseCache = globalWithMongoose.__mongoose ?? {
  conn: null,
  promise: null,
};

if (process.env.NODE_ENV !== "production") {
  globalWithMongoose.__mongoose = cache;
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn;

  if (!cache.promise) {
    cache.promise = mongoose.connect(mongoUri(), {
      serverSelectionTimeoutMS: 8000,
      maxPoolSize: 10,
      autoIndex: process.env.NODE_ENV !== "production",
    });
  }

  try {
    cache.conn = await cache.promise;
  } catch (error) {
    cache.promise = null;
    throw error;
  }

  return cache.conn;
}

export async function disconnectDB(): Promise<void> {
  if (cache.conn) {
    await cache.conn.disconnect();
    cache.conn = null;
    cache.promise = null;
  }
}
