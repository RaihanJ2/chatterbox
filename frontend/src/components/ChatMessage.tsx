import { Box } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface ChatMessageProps {
  content: string;
  role: "user" | "assistant";
}

const ChatMessage: React.FC<ChatMessageProps> = ({ content, role }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const isAssistant = role === "assistant";

  const renderContent = () => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts = content.split(codeBlockRegex);
    const elements = [];

    for (let i = 0; i < parts.length; i++) {
      if (i % 3 === 0) {
        if (parts[i]) {
          elements.push(
            <p className="whitespace-pre-wrap" key={`text-${i}`}>
              {parts[i]}
            </p>
          );
        }
      } else if (i % 3 === 1) {
        continue;
      } else if (i % 3 === 2) {
        const lang = parts[i - 1] || "plaintext";
        const code = parts[i];
        elements.push(
          <div key={`code-block-${i}`} className="relative group">
            <AnimatePresence>
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                onClick={() => {
                  navigator.clipboard
                    .writeText(code)
                    .then(() => {
                      setCopiedIndex(i);
                      setTimeout(() => setCopiedIndex(null), 1500);
                    })
                    .catch((err) => {
                      console.error("Failed to copy text: ", err);
                    });
                }}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-[#1e1e1e] text-gray-100 px-2 py-1 text-xs rounded transition-opacity"
              >
                {copiedIndex === i ? "Copied!" : "Copy"}
              </motion.button>
            </AnimatePresence>
            <SyntaxHighlighter
              language={lang}
              style={vscDarkPlus}
              customStyle={{
                borderRadius: "0.5rem",
                padding: "1rem",
                marginBottom: "0.75rem",
                fontSize: "0.875rem",
              }}
            >
              {code}
            </SyntaxHighlighter>
          </div>
        );
      }
    }

    return elements;
  };

  return (
    <div
      className={`flex items-start mb-4 ${
        isAssistant ? "flex-row" : "flex-row-reverse"
      }`}
    >
      <motion.div
        initial={{ opacity: 0, x: isAssistant ? -10 : 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 my-2 ${
          isAssistant ? "bg-secondary mr-4" : "bg-light ml-4 text-secondary"
        }`}
      >
        {isAssistant ? (
          <span className="text-highlight font-bold text-sm">
            <Box />
          </span>
        ) : (
          <span className="font-medium text-sm ">Y</span>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className=" bg-secondary p-3 rounded-xl max-w-none text-white"
      >
        {renderContent()}
      </motion.div>
    </div>
  );
};

export default ChatMessage;
