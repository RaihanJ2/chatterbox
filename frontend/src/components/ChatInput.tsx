import { SendHorizontal } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled }) => {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "0px";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = Math.min(scrollHeight, 200) + "px";
    }
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="flex flex-row justify-center border rounded-lg border-lightText dark:border-tetriary items-center bg-primary shadow-sm"
      >
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message Box..."
          disabled={disabled}
          className="flex-1 py-3 px-4 bg-transparent text-highlight placeholder-tetriary dark:placeholder-lightText outline-none resize-none min-h-[52px] max-h-[200px] overflow-auto"
          rows={1}
        />
        <motion.button
          initial={{ scale: 0, rotate: 0 }}
          animate={{ scale: 1, rotate: 360 }}
          transition={{ delay: 0.5 }}
          type="submit"
          disabled={!message.trim() || disabled}
          className={` p-2 rounded-md mx-3 ${
            !message.trim() || disabled
              ? "text-tetriary "
              : "text-highlight bg-secondary hover:bg-primary cursor-pointer"
          }`}
        >
          <SendHorizontal />
        </motion.button>
      </motion.div>
    </form>
  );
};

export default ChatInput;
