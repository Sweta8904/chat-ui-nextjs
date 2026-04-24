import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  throw new Error("❌ Please define MONGO_URI in .env.local");
}

// ✅ Extend global safely (TypeScript fix)
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

// ✅ Use existing cache or create new
const cached: MongooseCache = global.mongooseCache || {
  conn: null,
  promise: null,
};

global.mongooseCache = cached;

export default async function connectDB() {
  // ✅ If already connected → return
  if (cached.conn) {
    return cached.conn;
  }

  // ✅ If no promise → create connection
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGO_URI!, {
      dbName: "chatapp",
      bufferCommands: false,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null; // reset so retry works
    console.error("❌ MongoDB connection error:", error);
    throw error;
  }

  return cached.conn;
}