import mongoose, { Schema, models, model } from "mongoose";

const MessageSchema = new Schema(
  {
    // ✅ Unique message ID (required by spec)
    messageId: {
      type: String,
      required: true,
      unique: true,
    },

    // ✅ Link to user (REQUIRED for security)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ✅ Link to thread
    threadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Thread",
      required: true,
      index: true,
    },

    // ✅ Sender role
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },

    // ✅ Message content
    content: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true, // ✅ adds createdAt & updatedAt
  }
);

// ✅ Prevent model overwrite (Next.js fix)
const Message =
  models.Message || model("Message", MessageSchema);

export default Message;