import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  Menu,
  ChevronLeft,
} from "lucide-react";
import { ChatSummary } from "../api/chatHistory";

interface ChatSidebarProps {
  chats: ChatSummary[];
  currentChatId?: string;
  onChatSelect: (chatId: string) => void;
  onNewChat: () => void;
  onDeleteChat: (chatId: string) => void;
  onUpdateTitle: (chatId: string, title: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  chats,
  currentChatId,
  onChatSelect,
  onNewChat,
  onDeleteChat,
  onUpdateTitle,
  isOpen,
  onToggle,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const handleStartEdit = (chat: ChatSummary) => {
    setEditingId(chat._id);
    setEditTitle(chat.title);
  };

  const handleSaveEdit = async () => {
    if (editingId && editTitle.trim()) {
      try {
        await onUpdateTitle(editingId, editTitle.trim());
        setEditingId(null);
      } catch (error) {
        console.error("Error updating title:", error);
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
  };

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{
          x: isOpen ? 0 : -320,
        }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed left-0 top-0 h-full w-80 bg-[#351a2b] z-50 flex flex-col border-r border-[#602a4b]"
      >
        {/* Header */}
        <div className="p-4 border-b border-[#602a4b] flex items-center justify-between">
          <h2 className="text-[#c1a57b] font-medium">Chat History</h2>
          <button
            onClick={onToggle}
            className="text-[#c1a57b] hover:text-white p-1 rounded"
          >
            <ChevronLeft size={20} />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onNewChat}
            className="w-full bg-[#602a4b] text-[#c1a57b] p-3 rounded-lg flex items-center gap-2 hover:bg-[#502040] transition-colors"
          >
            <Plus size={16} />
            New Chat
          </motion.button>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {chats.map((chat) => (
            <motion.div
              key={chat._id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`group relative p-3 rounded-lg cursor-pointer transition-all ${
                currentChatId === chat._id
                  ? "bg-[#602a4b] text-white"
                  : "hover:bg-[#432439] text-[#b09a7d]"
              }`}
            >
              <div onClick={() => onChatSelect(chat._id)}>
                <div className="flex items-start gap-2">
                  <MessageSquare size={16} className="mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    {editingId === chat._id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="flex-1 bg-[#432439] text-white px-2 py-1 rounded text-sm"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveEdit();
                            if (e.key === "Escape") handleCancelEdit();
                          }}
                          autoFocus
                        />
                        <button
                          onClick={handleSaveEdit}
                          className="text-green-400 hover:text-green-300"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="font-medium text-sm truncate">
                          {chat.title}
                        </div>
                        <div className="text-xs opacity-70 mt-1">
                          {chat.messageCount} messages
                        </div>
                        <div className="text-xs opacity-50 truncate mt-1">
                          {new Date(chat.updatedAt).toLocaleDateString()}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              {editingId !== chat._id && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartEdit(chat);
                    }}
                    className="p-1 text-[#b09a7d] hover:text-white rounded"
                  >
                    <Edit3 size={12} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteChat(chat._id);
                    }}
                    className="p-1 text-red-400 hover:text-red-300 rounded"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              )}
            </motion.div>
          ))}

          {chats.length === 0 && (
            <div className="text-center text-[#8c5568] py-8">
              <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No chat history yet</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Mobile menu button */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onToggle}
        className="fixed top-4 left-4 z-30 md:hidden bg-[#602a4b] text-[#c1a57b] p-2 rounded-lg shadow-lg"
      >
        <Menu size={20} />
      </motion.button>
    </>
  );
};

export default ChatSidebar;
