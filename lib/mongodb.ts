import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI!;

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export default async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGO_URI, {
      dbName: "chatapp",
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}