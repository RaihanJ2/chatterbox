"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const express_1 = require("express");
const auth_1 = require("./auth");
const Chats_1 = __importDefault(require("../models/Chats"));
const router = (0, express_1.Router)();
const API_URL = process.env.API_URL;
const API_KEY = process.env.API_KEY;
router.post("/", auth_1.authenticateSession, async (req, res) => {
    try {
        const { message, chatId } = req.body;
        if (!message) {
            res.status(400).json({ error: "Message is required" });
            return;
        }
        // Find or create chat
        let chat;
        if (chatId) {
            chat = await Chats_1.default.findOne({ _id: chatId, userId: req.user.id });
            if (!chat) {
                res.status(404).json({ error: "Chat not found" });
                return;
            }
        }
        else {
            // Create new chat
            chat = new Chats_1.default({
                userId: req.user.id,
                title: "New Chat",
                messages: [],
            });
        }
        // Add user message to chat
        chat.messages.push({
            role: "user",
            content: message,
            timestamp: new Date(),
        });
        // Prepare chat history for API (limit to last 20 messages for context)
        const recentMessages = chat.messages.slice(-20).map((msg) => ({
            role: msg.role,
            content: msg.content,
        }));
        if (!API_URL) {
            res.status(500).json({ error: "API_URL is not configured" });
            return;
        }
        // Call AI API
        const requestBody = {
            model: "gpt-4o-mini",
            messages: recentMessages,
            temperature: 0.7,
            max_tokens: 1000,
        };
        const aiResponse = await axios_1.default.post(API_URL, requestBody, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${API_KEY}`,
            },
        });
        if (aiResponse.data.choices && aiResponse.data.choices.length > 0) {
            if (aiResponse.data.choices[0].message) {
                const assistantMessage = aiResponse.data.choices[0].message.content;
                // Add assistant response to chat
                chat.messages.push({
                    role: "assistant",
                    content: assistantMessage,
                    timestamp: new Date(),
                });
                // Generate title if it's a new chat
                if (!chatId && chat.messages.length === 2) {
                    chat.generateTitle();
                }
                // Save chat
                await chat.save();
                res.json({
                    response: assistantMessage,
                    chatId: chat._id,
                    title: chat.title,
                });
                return;
            }
        }
        console.warn("Unexpected response from AI API:", aiResponse.data);
        res.status(500).json({
            error: "Unexpected response format from AI service",
            response: "I encountered an issue processing your request. Please try again.",
        });
        return;
    }
    catch (error) {
        if (error instanceof Error) {
            console.error("Error in chat processing:", error.message);
            if (axios_1.default.isAxiosError(error)) {
                console.error("Axios error details:", error.response?.data);
                if (error.response?.status === 401) {
                    res.status(500).json({ error: "API authentication failed" });
                    return;
                }
                else if (error.response?.status === 429) {
                    res
                        .status(429)
                        .json({ error: "Rate limit exceeded. Please try again later." });
                    return;
                }
                res.status(500).json({
                    error: error.response?.data?.error?.message ||
                        "API service error",
                });
                return;
            }
            res
                .status(500)
                .json({ error: "An error occurred while processing your request" });
            return;
        }
        else {
            console.error("Unexpected error type:", error);
            res.status(500).json({ error: "An unknown error occurred" });
            return;
        }
    }
});
exports.default = router;
