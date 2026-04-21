import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    // ✅ Link to thread
    threadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Thread",
      required: true,
    },

    // ✅ (Optional but recommended) Link to user
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // ✅ Who sent the message
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },

    // ✅ Actual message content
    content: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true, // ✅ auto adds createdAt & updatedAt
  }
);

export default mongoose.models.Message ||
  mongoose.model("Message", MessageSchema);