import mongoose, { Schema, Document } from "mongoose";

export interface MessageType {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface ChatType extends Document {
  userId: mongoose.Types.ObjectId;
  title?: string;
  messages: MessageType[];
  createdAt: Date;
  updatedAt: Date;
  generateTitle(): void;
}

const MessageSchema = new Schema({
  role: {
    type: String,
    enum: ["user", "assistant"],
    required: true,
  },
  content: {
    type: String,
    required: true,
    maxlength: 10000,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const ChatSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      maxlength: 100,
      default: "New Chat",
      trim: true,
    },
    messages: [MessageSchema],
  },
  { timestamps: true }
);

// Index for better query performance
ChatSchema.index({ userId: 1, updatedAt: -1 });

// Method to generate title from first message
ChatSchema.methods.generateTitle = function (this: ChatType) {
  if (this.messages.length > 0 && this.messages[0].role === "user") {
    const firstMessage = this.messages[0].content.trim();

    if (firstMessage.length === 0) {
      this.title = "New Chat";
      return;
    }

    // Clean up the message: remove extra whitespace and newlines
    const cleanMessage = firstMessage.replace(/\s+/g, " ");

    // Generate title with better truncation (avoid cutting words)
    if (cleanMessage.length <= 50) {
      this.title = cleanMessage;
    } else {
      // Find the last space before position 47 to avoid cutting words
      const truncateAt = cleanMessage.lastIndexOf(" ", 47);
      if (truncateAt > 20) {
        // Only use word boundary if it's not too short
        this.title = cleanMessage.substring(0, truncateAt) + "...";
      } else {
        this.title = cleanMessage.substring(0, 47) + "...";
      }
    }
  } else {
    this.title = "New Chat";
  }
};

const Chat = mongoose.model<ChatType>("Chat", ChatSchema);
export default Chat;
