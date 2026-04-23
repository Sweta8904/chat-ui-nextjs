import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI as string;

if (!MONGO_URI) {
  throw new Error("❌ Please define MONGO_URI in .env.local");
}

// Extend global type (for caching in dev)
declare global {
  var mongooseCache: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

// Initialize cache if not present
const cached = global.mongooseCache || {
  conn: null,
  promise: null,
};

global.mongooseCache = cached;

export default async function connectDB() {
  try {
    // Return cached connection
    if (cached.conn) {
      return cached.conn;
    }

    // Create new connection if not exists
    if (!cached.promise) {
      cached.promise = mongoose.connect(MONGO_URI, {
        dbName: "chatapp",
        bufferCommands: false,
      });
    }

    cached.conn = await cached.promise;

    return cached.conn;
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    throw error;
  }
}