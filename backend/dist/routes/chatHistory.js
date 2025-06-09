"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("./auth");
const Chats_1 = __importDefault(require("../models/Chats"));
const router = (0, express_1.Router)();
// Get all chats for a user
router.get("/", auth_1.authenticateSession, async (req, res) => {
    try {
        const chats = await Chats_1.default.find({ userId: req.user.id })
            .select("_id title updatedAt messages")
            .sort({ updatedAt: -1 })
            .limit(50);
        // Include message count and last message preview
        const chatsWithPreview = chats.map((chat) => ({
            _id: chat._id,
            title: chat.title,
            updatedAt: chat.updatedAt,
            messageCount: chat.messages.length,
            lastMessage: chat.messages.length > 0
                ? chat.messages[chat.messages.length - 1].content.substring(0, 100) +
                    (chat.messages[chat.messages.length - 1].content.length > 100
                        ? "..."
                        : "")
                : null,
        }));
        res.json(chatsWithPreview);
    }
    catch (error) {
        console.error("Error fetching chat history:", error);
        res.status(500).json({ error: "Failed to fetch chat history" });
    }
});
// Get specific chat with all messages
router.get("/:chatId", auth_1.authenticateSession, async (req, res) => {
    try {
        const chat = await Chats_1.default.findOne({
            _id: req.params.chatId,
            userId: req.user.id,
        });
        if (!chat) {
            res.status(404).json({ error: "Chat not found" });
            return;
        }
        res.json(chat);
    }
    catch (error) {
        console.error("Error fetching chat:", error);
        res.status(500).json({ error: "Failed to fetch chat" });
    }
});
// Create new chat
router.post("/", auth_1.authenticateSession, async (req, res) => {
    try {
        const { title } = req.body;
        const newChat = new Chats_1.default({
            userId: req.user.id,
            title: title || "New Chat",
            messages: [],
        });
        await newChat.save();
        res.status(201).json(newChat);
    }
    catch (error) {
        console.error("Error creating chat:", error);
        res.status(500).json({ error: "Failed to create chat" });
    }
});
// Update chat title
router.patch("/:chatId/title", auth_1.authenticateSession, async (req, res) => {
    try {
        const { title } = req.body;
        if (!title || title.trim().length === 0) {
            res.status(400).json({ error: "Title is required" });
            return;
        }
        const chat = await Chats_1.default.findOneAndUpdate({ _id: req.params.chatId, userId: req.user.id }, { title: title.trim() }, { new: true });
        if (!chat) {
            res.status(404).json({ error: "Chat not found" });
            return;
        }
        res.json({ title: chat.title });
    }
    catch (error) {
        console.error("Error updating chat title:", error);
        res.status(500).json({ error: "Failed to update chat title" });
    }
});
// Delete chat
router.delete("/:chatId", auth_1.authenticateSession, async (req, res) => {
    try {
        const chat = await Chats_1.default.findOneAndDelete({
            _id: req.params.chatId,
            userId: req.user.id,
        });
        if (!chat) {
            res.status(404).json({ error: "Chat not found" });
            return;
        }
        res.json({ message: "Chat deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting chat:", error);
        res.status(500).json({ error: "Failed to delete chat" });
    }
});
// Clear all messages from a chat (optional additional endpoint)
router.delete("/:chatId/messages", auth_1.authenticateSession, async (req, res) => {
    try {
        const chat = await Chats_1.default.findOneAndUpdate({ _id: req.params.chatId, userId: req.user.id }, { messages: [] }, { new: true });
        if (!chat) {
            res.status(404).json({ error: "Chat not found" });
            return;
        }
        res.json({ message: "Chat messages cleared successfully", chat });
    }
    catch (error) {
        console.error("Error clearing chat messages:", error);
        res.status(500).json({ error: "Failed to clear chat messages" });
    }
});
exports.default = router;
