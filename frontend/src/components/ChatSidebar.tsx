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
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      {/* Toggle button - always visible when sidebar is closed */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileTap={{ scale: 0.95 }}
            onClick={onToggle}
            className="fixed top-20 left-4 z-30 bg-[#602a4b] text-[#c1a57b] p-3 rounded-lg shadow-lg hover:bg-[#502040] transition-colors"
          >
            <Menu size={20} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Sidebar - Fixed positioning for both mobile and desktop */}
      <motion.aside
        initial={false}
        animate={{
          x: isOpen ? 0 : -320,
        }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed left-0 top-0 h-full w-80 bg-[#351a2b] z-50 flex flex-col border-r border-[#602a4b] shadow-xl"
      >
        {/* Header */}
        <div className="p-4 border-b border-[#602a4b] flex items-center justify-between bg-[#2a1521]">
          <div className="flex items-center gap-3">
            {/* Menu button beside the title - only visible when sidebar is open */}
            <button
              onClick={onToggle}
              className="text-[#c1a57b] hover:text-white p-2 rounded-lg hover:bg-[#432439] transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <h2 className="text-[#c1a57b] font-medium text-lg">Chat History</h2>
          </div>
          {/* Keep X button for mobile only */}
          <button
            onClick={onToggle}
            className="text-[#c1a57b] hover:text-white p-2 rounded-lg hover:bg-[#432439] transition-colors md:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-4 bg-[#2a1521]">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              onNewChat();
              // Close sidebar on mobile after creating new chat
              if (window.innerWidth < 768) {
                onToggle();
              }
            }}
            className="w-full bg-[#602a4b] text-[#c1a57b] p-3 rounded-lg flex items-center justify-center gap-2 hover:bg-[#502040] transition-colors font-medium shadow-sm"
          >
            <Plus size={18} />
            New Chat
          </motion.button>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#602a4b] scrollbar-track-transparent">
          <div className="p-4 space-y-2">
            {chats.map((chat, index) => (
              <motion.div
                key={chat._id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`group relative p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                  currentChatId === chat._id
                    ? "bg-[#602a4b] text-white shadow-md"
                    : "hover:bg-[#432439] text-[#b09a7d] hover:text-white"
                }`}
              >
                <div
                  onClick={() => {
                    onChatSelect(chat._id);
                    // Close sidebar on mobile after selecting chat
                    if (window.innerWidth < 768) {
                      onToggle();
                    }
                  }}
                  className="w-full"
                >
                  <div className="flex items-start gap-3">
                    <MessageSquare
                      size={16}
                      className="mt-1 flex-shrink-0 opacity-70"
                    />
                    <div className="flex-1 min-w-0">
                      {editingId === chat._id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="flex-1 bg-[#432439] text-white px-3 py-2 rounded-md text-sm border border-[#602a4b] focus:border-[#c1a57b] focus:outline-none"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveEdit();
                              if (e.key === "Escape") handleCancelEdit();
                            }}
                            maxLength={100}
                            autoFocus
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSaveEdit();
                            }}
                            className="text-green-400 hover:text-green-300 p-1 rounded transition-colors"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelEdit();
                            }}
                            className="text-red-400 hover:text-red-300 p-1 rounded transition-colors"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="font-medium text-sm truncate mb-1">
                            {chat.title}
                          </div>
                          <div className="text-xs opacity-60 mb-1">
                            {chat.messageCount} message
                            {chat.messageCount !== 1 ? "s" : ""}
                          </div>
                          <div className="text-xs opacity-50">
                            {new Date(chat.updatedAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                {editingId !== chat._id && (
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartEdit(chat);
                      }}
                      className="p-1.5 text-[#b09a7d] hover:text-white rounded hover:bg-[#602a4b] transition-colors"
                      title="Edit title"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (
                          window.confirm(
                            "Are you sure you want to delete this chat?"
                          )
                        ) {
                          onDeleteChat(chat._id);
                        }
                      }}
                      className="p-1.5 text-red-400 hover:text-red-300 rounded hover:bg-red-500/20 transition-colors"
                      title="Delete chat"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </motion.div>
            ))}

            {chats.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-center text-[#8c5568] py-12"
              >
                <MessageSquare size={40} className="mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium mb-1">No chat history yet</p>
                <p className="text-xs opacity-70">
                  Start a conversation to see your chats here
                </p>
              </motion.div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-[#602a4b] bg-[#2a1521]">
          <div className="text-xs text-[#8c5568] text-center">
            {chats.length} chat{chats.length !== 1 ? "s" : ""} saved
          </div>
        </div>
      </motion.aside>
    </>
  );
};

export default ChatSidebar;
