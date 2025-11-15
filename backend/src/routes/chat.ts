import axios from "axios";
import { Request, Response, Router } from "express";
import { authenticateSession } from "./auth";
import Chat from "../models/Chats";

const router = Router();

const API_URL = process.env.API_URL + "/v1/chat/completions";
const API_KEY = process.env.API_KEY;

router.post(
  "/",
  authenticateSession,
  async (req: Request & { user?: any }, res: Response) => {
    try {
      const { message, chatId } = req.body;

      if (!message) {
        res.status(400).json({ error: "Message is required" });
        return;
      }

      // Find or create chat
      let chat;
      if (chatId) {
        chat = await Chat.findOne({ _id: chatId, userId: req.user.id });
        if (!chat) {
          res.status(404).json({ error: "Chat not found" });
          return;
        }
      } else {
        chat = new Chat({
          userId: req.user.id,
          title: "New Chat",
          messages: [],
        });
      }

      // Add user message
      chat.messages.push({
        role: "user",
        content: message,
        timestamp: new Date(),
      });

      // Limit chat history
      const recentMessages = chat.messages.slice(-20).map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      if (!API_URL || !API_KEY) {
        res.status(500).json({
          error: "API configuration error: Missing API_URL or API_KEY",
        });
        return;
      }

      // Minimal payload - only supported parameters
      const payload = {
        model: "openai/gpt-5",
        messages: recentMessages,
        max_completion_tokens: 1000,
        stream: false,
      };

      console.log("Sending request to MLAPI:", {
        url: API_URL,
        model: payload.model,
        messageCount: recentMessages.length,
      });

      // Call MLAPI
      const aiResponse = await axios.post(API_URL, payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        timeout: 30000, // 30 second timeout
      });

      // Parse response for OpenAI format
      const choice = aiResponse.data?.choices?.[0]?.message;

      if (!choice || !choice.content) {
        console.warn("Unexpected MLAPI response structure:", aiResponse.data);
        res.status(500).json({
          error: "Unexpected response from AI service",
        });
        return;
      }

      const assistantMessage = choice.content;

      // Save assistant message
      chat.messages.push({
        role: "assistant",
        content: assistantMessage,
        timestamp: new Date(),
      });

      // Generate title for brand new chat
      if (!chatId && chat.messages.length === 2) {
        await chat.generateTitle();
      }

      await chat.save();

      res.json({
        response: assistantMessage,
        chatId: chat._id,
        title: chat.title,
      });
      return;
    } catch (error: any) {
      console.error("Chat route error:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
      });

      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const errorData = error.response?.data;

        if (status === 401) {
          res.status(500).json({
            error: "API authentication failed - check your API_KEY",
          });
          return;
        }

        if (status === 429) {
          res.status(429).json({
            error: "Rate limit exceeded. Please try again later.",
          });
          return;
        }

        if (status === 400) {
          res.status(400).json({
            error: errorData?.error?.message || "Invalid request to AI service",
          });
          return;
        }

        if (error.code === "ECONNABORTED") {
          res.status(504).json({
            error: "AI service timeout. Please try again.",
          });
          return;
        }

        res.status(500).json({
          error: errorData?.error?.message || "AI service error",
        });
        return;
      }

      res.status(500).json({
        error: "An unexpected error occurred",
      });
      return;
    }
  }
);

export default router;
