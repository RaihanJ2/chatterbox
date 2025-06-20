"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const MessageSchema = new mongoose_1.Schema({
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
const ChatSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
}, { timestamps: true });
// Index for better query performance
ChatSchema.index({ userId: 1, updatedAt: -1 });
// Method to generate title from first message
ChatSchema.methods.generateTitle = function () {
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
        }
        else {
            // Find the last space before position 47 to avoid cutting words
            const truncateAt = cleanMessage.lastIndexOf(" ", 47);
            if (truncateAt > 20) {
                // Only use word boundary if it's not too short
                this.title = cleanMessage.substring(0, truncateAt) + "...";
            }
            else {
                this.title = cleanMessage.substring(0, 47) + "...";
            }
        }
    }
    else {
        this.title = "New Chat";
    }
};
const Chat = mongoose_1.default.model("Chat", ChatSchema);
exports.default = Chat;
