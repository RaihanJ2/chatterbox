import express, { Request, Response } from "express";
import Chat from "../models/Chats";
import { authenticateSession } from "./auth";

const router = express.Router();

// Get all chats for a user
router.get(
  "/",
  authenticateSession,
  async (req: Request & { user?: any }, res: Response) => {
    try {
      const chats = await Chat.find({ userId: req.user.id })
        .sort({ updatedAt: -1 })
        .select("title messages createdAt updatedAt");

      const chatSummaries = chats.map((chat) => ({
        _id: chat._id,
        title: chat.title,
        messageCount: chat.messages.length,
        updatedAt: chat.updatedAt,
        lastMessage:
          chat.messages.length > 0
            ? chat.messages[chat.messages.length - 1].content.substring(0, 100)
            : "",
      }));

      res.json(chatSummaries);
    } catch (error) {
      console.error("Error fetching chats:", error);
      res.status(500).json({ message: "Error fetching chats" });
    }
  }
);

// Get specific chat
router.get(
  "/:chatId",
  authenticateSession,
  async (req: Request & { user?: any }, res: Response) => {
    try {
      const chat = await Chat.findOne({
        _id: req.params.chatId,
        userId: req.user.id,
      });

      if (!chat) {
        res.status(404).json({ message: "Chat not found" });
        return;
      }

      res.json(chat);
    } catch (error) {
      console.error("Error fetching chat:", error);
      res.status(500).json({ message: "Error fetching chat" });
    }
  }
);

// Send message (create new chat or add to existing)
router.post(
  "/message",
  authenticateSession,
  async (req: Request & { user?: any }, res: Response) => {
    try {
      const { message, chatId } = req.body;

      if (!message || !message.trim()) {
        res.status(400).json({ message: "Message is required" });
        return;
      }

      let chat;
      let isNewChat = false;

      if (chatId) {
        // Add to existing chat
        chat = await Chat.findOne({ _id: chatId, userId: req.user.id });
        if (!chat) {
          res.status(404).json({ message: "Chat not found" });
          return;
        }
      } else {
        // Create new chat
        chat = new Chat({
          userId: req.user.id,
          messages: [],
        });
        isNewChat = true;
      }

      // Add user message
      chat.messages.push({
        role: "user",
        content: message,
        timestamp: new Date(),
      });

      // Simple AI response (replace with actual AI integration)
      const aiResponse = `This is a response to: "${message}". Please integrate with your AI service here.`;

      chat.messages.push({
        role: "assistant",
        content: aiResponse,
        timestamp: new Date(),
      });

      // Generate title for new chats
      if (isNewChat) {
        chat.generateTitle();
      }

      await chat.save();

      res.json({
        response: aiResponse,
        chatId: chat._id,
        title: chat.title,
      });
    } catch (error) {
      console.error("Error processing message:", error);
      res.status(500).json({ message: "Error processing message" });
    }
  }
);

// Update chat title
router.put(
  "/:chatId/title",
  authenticateSession,
  async (req: Request & { user?: any }, res: Response) => {
    try {
      const { title } = req.body;

      if (!title || !title.trim()) {
        res.status(400).json({ message: "Title is required" });
        return;
      }

      const chat = await Chat.findOneAndUpdate(
        { _id: req.params.chatId, userId: req.user.id },
        { title: title.trim() },
        { new: true }
      );

      if (!chat) {
        res.status(404).json({ message: "Chat not found" });
        return;
      }

      res.json({ message: "Title updated successfully" });
    } catch (error) {
      console.error("Error updating title:", error);
      res.status(500).json({ message: "Error updating title" });
    }
  }
);

// Delete chat
router.delete(
  "/:chatId",
  authenticateSession,
  async (req: Request & { user?: any }, res: Response) => {
    try {
      const chat = await Chat.findOneAndDelete({
        _id: req.params.chatId,
        userId: req.user.id,
      });

      if (!chat) {
        res.status(404).json({ message: "Chat not found" });
        return;
      }

      res.json({ message: "Chat deleted successfully" });
    } catch (error) {
      console.error("Error deleting chat:", error);
      res.status(500).json({ message: "Error deleting chat" });
    }
  }
);

export default router;
