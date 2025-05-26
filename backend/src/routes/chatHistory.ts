import { Request, Response, Router } from "express";
import { authenticateSession } from "./auth";
import Chat from "../models/Chats";

const router = Router();

// Get all chats for a user
router.get(
  "/",
  authenticateSession,
  async (req: Request & { user?: any }, res: Response) => {
    try {
      const chats = await Chat.find({ userId: req.user.id })
        .select("_id title updatedAt messages")
        .sort({ updatedAt: -1 })
        .limit(50);

      // Include message count and last message preview
      const chatsWithPreview = chats.map((chat) => ({
        _id: chat._id,
        title: chat.title,
        updatedAt: chat.updatedAt,
        messageCount: chat.messages.length,
        lastMessage:
          chat.messages.length > 0
            ? chat.messages[chat.messages.length - 1].content.substring(
                0,
                100
              ) +
              (chat.messages[chat.messages.length - 1].content.length > 100
                ? "..."
                : "")
            : null,
      }));

      res.json(chatsWithPreview);
    } catch (error) {
      console.error("Error fetching chat history:", error);
      res.status(500).json({ error: "Failed to fetch chat history" });
    }
  }
);

// Get specific chat with all messages
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
        res.status(404).json({ error: "Chat not found" });
        return;
      }

      res.json(chat);
    } catch (error) {
      console.error("Error fetching chat:", error);
      res.status(500).json({ error: "Failed to fetch chat" });
    }
  }
);

// Create new chat
router.post(
  "/",
  authenticateSession,
  async (req: Request & { user?: any }, res: Response) => {
    try {
      const { title } = req.body;

      const newChat = new Chat({
        userId: req.user.id,
        title: title || "New Chat",
        messages: [],
      });

      await newChat.save();
      res.status(201).json(newChat);
    } catch (error) {
      console.error("Error creating chat:", error);
      res.status(500).json({ error: "Failed to create chat" });
    }
  }
);

// Update chat title
router.patch(
  "/:chatId/title",
  authenticateSession,
  async (req: Request & { user?: any }, res: Response) => {
    try {
      const { title } = req.body;

      if (!title || title.trim().length === 0) {
        res.status(400).json({ error: "Title is required" });
        return;
      }

      const chat = await Chat.findOneAndUpdate(
        { _id: req.params.chatId, userId: req.user.id },
        { title: title.trim() },
        { new: true }
      );

      if (!chat) {
        res.status(404).json({ error: "Chat not found" });
        return;
      }

      res.json({ title: chat.title });
    } catch (error) {
      console.error("Error updating chat title:", error);
      res.status(500).json({ error: "Failed to update chat title" });
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
        res.status(404).json({ error: "Chat not found" });
        return;
      }

      res.json({ message: "Chat deleted successfully" });
    } catch (error) {
      console.error("Error deleting chat:", error);
      res.status(500).json({ error: "Failed to delete chat" });
    }
  }
);

// Clear all messages from a chat (optional additional endpoint)
router.delete(
  "/:chatId/messages",
  authenticateSession,
  async (req: Request & { user?: any }, res: Response) => {
    try {
      const chat = await Chat.findOneAndUpdate(
        { _id: req.params.chatId, userId: req.user.id },
        { messages: [] },
        { new: true }
      );

      if (!chat) {
        res.status(404).json({ error: "Chat not found" });
        return;
      }

      res.json({ message: "Chat messages cleared successfully", chat });
    } catch (error) {
      console.error("Error clearing chat messages:", error);
      res.status(500).json({ error: "Failed to clear chat messages" });
    }
  }
);

export default router;
