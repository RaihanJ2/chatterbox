import { useState, useEffect, useRef } from "react";
import { sendMessageToAPI } from "./api/chat";
import ChatMessage from "./components/ChatMessage";
import ChatInput from "./components/ChatInput";
import { Box } from "lucide-react";
import { motion } from "framer-motion";
import { FaGoogle } from "react-icons/fa";
import { getSession, logout } from "./api/auth";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}
interface User {
  id: string;
  name?: string;
  email?: string;
  image?: string;
}

interface Session {
  user: User | null;
}
function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      const sessionData = await getSession();
      setSession(sessionData);
      setIsLoading(false);
    };

    fetchSession();
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleGoogleSignIn = () => {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
    window.location.href = `${apiUrl}/api/auth/google`;
  };

  const handleLogout = async () => {
    const success = await logout();
    if (success) {
      setSession({ user: null });
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    // Reset any previous errors
    setApiError(null);

    // Add user message to the chat
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: "user",
      timestamp: new Date(),
    };

    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setIsLoading(true);

    try {
      // Prepare chat history for context
      const chatHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Call API
      const response = await sendMessageToAPI(content, chatHistory);

      // Add assistant's response to chat
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        role: "assistant",
        timestamp: new Date(),
      };

      setMessages((prevMessages) => [...prevMessages, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);

      // Extract error message
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      setApiError(errorMessage);

      // Add error message
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: `Sorry, there was an error: ${errorMessage}. Please check your API key or try again later.`,
        role: "assistant",
        timestamp: new Date(),
      };

      setMessages((prevMessages) => [...prevMessages, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen font-poppins bg-[#432439] ">
      {/* Header */}
      <header className="bg-[#602a4b] py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <motion.h1
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex flex-row items-center justify-center  text-[#c1a57b] text-xl font-medium"
          >
            Chatterb
            <motion.span
              initial={{ scale: 0, rotate: 0 }}
              animate={{ scale: 1, rotate: 360 }}
              whileTap={{ rotate: 0 }}
            >
              <Box />
            </motion.span>
            x
          </motion.h1>
          {session?.user ? (
            <div className="flex items-center gap-3">
              {session.user.image && (
                <div className="w-8 h-8 rounded-full overflow-hidden">
                  <img
                    src={session.user.image}
                    alt={`${session.user.name}'s profile`}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <button
                onClick={handleLogout}
                className="cursor-pointer text-[#c1a57b] px-4 py-2 rounded-md hover:bg-[#502040]"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={handleGoogleSignIn}
              className="cursor-pointer text-[#c1a57b] flex flex-row items-center gap-2 p-2 rounded-md hover:bg-[#502040]"
            >
              <FaGoogle /> Login with Google
            </button>
          )}
        </div>
      </header>

      {/* Main chat area */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <motion.span
                initial={{ scale: 0, rotate: 0 }}
                animate={{ scale: 1, rotate: 360 }}
                className="text-[#c1a57b] font-bold bg-[#602a4b] p-4 rounded-full "
              >
                <Box size={50} />
              </motion.span>
              <motion.h2
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-xl font-medium text-[#b09a7d] mb-2"
              >
                How can I help you today?
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65 }}
                className="text-[#b09a7d] max-w-md"
              >
                Ask me anything, from solving complex problems to creative
                tasks.
              </motion.p>
            </div>
          ) : (
            messages.map((message) => (
              <ChatMessage
                key={message.id}
                content={message.content}
                role={message.role}
              />
            ))
          )}
          {apiError && (
            <div className="text-red-500 text-sm">API Error: {apiError}</div>
          )}
          {isLoading && (
            <div className="flex items-start">
              <div className="w-8 h-8 rounded-full bg-[#602a4b] flex items-center justify-center mr-4 flex-shrink-0">
                <span className="text-[#c1a57b] font-bold text-sm">
                  <Box />
                </span>
              </div>
              <div className="flex space-x-2 mt-3">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{
                      scale: [1, 1.4, 1],
                      opacity: [0.6, 1, 0.6],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: i * 0.2,
                    }}
                    className="h-2 w-2 bg-[#c1a57b] rounded-full"
                  ></motion.div>
                ))}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input area */}
      <footer className=" p-4 bg-[#602a4b]">
        <div className="max-w-4xl mx-auto">
          <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-center text-[#b09a7d] mt-2"
          >
            Chatterbox may display inaccurate info, including about people, so
            double-check its responses.
          </motion.div>
        </div>
      </footer>
    </div>
  );
}

export default App;
