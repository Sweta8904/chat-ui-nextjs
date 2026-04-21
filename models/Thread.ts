import mongoose from "mongoose";

const ThreadSchema = new mongoose.Schema(
  {
    userId: {
      type: String, // later you can switch to ObjectId
      required: true,
    },
    title: {
      type: String,
      default: "New Chat",
    },
  },
  { timestamps: true }
);

export default mongoose.models.Thread ||
  mongoose.model("Thread", ThreadSchema);