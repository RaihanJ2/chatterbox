import { useState, useEffect, useRef } from "react";
import ChatMessage from "./components/ChatMessage";
import ChatInput from "./components/ChatInput";
import ChatSidebar from "./components/ChatSidebar";
import { Box, Menu } from "lucide-react";
import { motion } from "framer-motion";
import { FaGoogle } from "react-icons/fa";
import { getSession, logout } from "./api/auth";
import {
  sendMessageToAPI,
  getChatHistory,
  getChatById,
  updateChatTitle,
  deleteChat,
  ChatSummary,
} from "./api/chatHistory";

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
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | undefined>();
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && !sidebarOpen) {
        setSidebarOpen(true);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [sidebarOpen]);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        setIsLoading(true);
        const sessionData = await getSession();
        setSession(sessionData);

        if (sessionData?.user) {
          // Load chat history if user is logged in
          await loadChatHistory();
        }
      } catch (error) {
        console.error("Error fetching session:", error);
        setApiError("Failed to load session. Please refresh the page.");
        // Ensure chats is still an array even if there's an error
        setChats([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadChatHistory = async () => {
    try {
      const chatHistory = await getChatHistory();
      // Ensure we always set an array, even if the API returns something unexpected
      setChats(Array.isArray(chatHistory) ? chatHistory : []);
    } catch (error) {
      console.error("Error loading chat history:", error);
      // Set empty array on error to prevent the map error
      setChats([]);
    }
  };

  const handleChatSelect = async (chatId: string) => {
    try {
      setIsLoading(true);
      const chat = await getChatById(chatId);

      // Convert chat messages to the expected format
      const formattedMessages: Message[] = chat.messages.map((msg, index) => ({
        id: `${chatId}-${index}`,
        content: msg.content,
        role: msg.role,
        timestamp: new Date(msg.timestamp),
      }));

      setMessages(formattedMessages);
      setCurrentChatId(chatId);
      setSidebarOpen(false); // Close sidebar on mobile after selection
    } catch (error) {
      console.error("Error loading chat:", error);
      setApiError("Failed to load chat");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setCurrentChatId(undefined);
    setSidebarOpen(false);
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      await deleteChat(chatId);

      // Remove from local state - ensure chats is an array before filtering
      setChats((prevChats) =>
        Array.isArray(prevChats)
          ? prevChats.filter((chat) => chat._id !== chatId)
          : []
      );

      // If we're currently viewing this chat, start a new one
      if (currentChatId === chatId) {
        handleNewChat();
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
      setApiError("Failed to delete chat");
    }
  };

  const handleUpdateTitle = async (chatId: string, title: string) => {
    try {
      await updateChatTitle(chatId, title);

      // Update local state - ensure chats is an array before mapping
      setChats((prevChats) =>
        Array.isArray(prevChats)
          ? prevChats.map((chat) =>
              chat._id === chatId ? { ...chat, title } : chat
            )
          : []
      );
    } catch (error) {
      console.error("Error updating chat title:", error);
      throw error;
    }
  };

  const handleGoogleSignIn = () => {
    const apiUrl = import.meta.env.VITE_API_URL;
    window.location.href = `${apiUrl}/api/auth/google`;
  };

  const handleLogout = async () => {
    const success = await logout();
    if (success) {
      setSession({ user: null });
      setMessages([]);
      setChats([]);
      setCurrentChatId(undefined);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    // Check if user is logged in
    if (!session?.user) {
      setApiError("Please log in to send messages");
      return;
    }

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
      // Call API with current chat ID
      const response = await sendMessageToAPI(content, currentChatId);

      // Add assistant's response to chat
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.response,
        role: "assistant",
        timestamp: new Date(),
      };

      setMessages((prevMessages) => [...prevMessages, assistantMessage]);

      // Update current chat ID if this was a new chat
      if (!currentChatId) {
        setCurrentChatId(response.chatId);
        // Refresh chat history to show the new chat
        await loadChatHistory();
      } else {
        // Update the existing chat in the sidebar - ensure chats is an array
        setChats((prevChats) =>
          Array.isArray(prevChats)
            ? prevChats.map((chat) =>
                chat._id === response.chatId
                  ? {
                      ...chat,
                      title: response.title,
                      messageCount: chat.messageCount + 2,
                      updatedAt: new Date().toISOString(),
                      lastMessage:
                        response.response.substring(0, 100) +
                        (response.response.length > 100 ? "..." : ""),
                    }
                  : chat
              )
            : []
        );
      }
    } catch (error) {
      console.error("Error sending message:", error);

      // Handle authentication errors specifically
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";

      if (errorMessage.includes("Authentication required")) {
        // Reset session if authentication failed
        setSession({ user: null });
        setMessages([]);
        setChats([]);
        setCurrentChatId(undefined);
        setApiError("Your session has expired. Please log in again.");
      } else {
        setApiError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !session) {
    return (
      <main className="fixed inset-0 flex items-center justify-center bg-secondary z-50">
        <div className="flex flex-col items-center text-center">
          <motion.span
            initial={{ scale: 0.7, rotate: 0 }}
            animate={{ scale: 1, rotate: 360 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
            className="text-highlight font-bold p-4 rounded-full"
          >
            <Box size={50} />
          </motion.span>
        </div>
      </main>
    );
  }

  return (
    <div className="flex w-full h-screen font-poppins bg-primary relative">
      {/* Sidebar - always render if user is logged in, positioned fixed */}
      {session?.user && (
        <ChatSidebar
          chats={Array.isArray(chats) ? chats : []}
          currentChatId={currentChatId}
          onChatSelect={handleChatSelect}
          onNewChat={handleNewChat}
          onDeleteChat={handleDeleteChat}
          onUpdateTitle={handleUpdateTitle}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />
      )}

      {/* Main content - always full width since sidebar is fixed */}
      <div className="flex flex-col flex-1 w-full">
        {/* Header */}
        <header className=" bg-secondary py-4 px-6">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Menu button beside logo - only show when user is logged in */}
              {session?.user && (
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="text-highlight hover:text-white p-2 rounded-lg hover:bg-accent transition-colors"
                >
                  <Menu size={20} />
                </button>
              )}
              <motion.h1
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex flex-row items-center justify-center text-highlight text-xl font-medium"
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
            </div>
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
                <span className="text-highlight text-sm">
                  {session.user.name}
                </span>
                <button
                  onClick={handleLogout}
                  className="cursor-pointer text-highlight px-4 py-2 rounded-md hover:bg-accent"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={handleGoogleSignIn}
                className="cursor-pointer text-highlight flex flex-row items-center gap-2 p-2 rounded-md hover:bg-accent"
              >
                <FaGoogle /> Login with Google
              </button>
            )}
          </div>
        </header>

        {/* Main chat area */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-6 space-y-6">
            {!session?.user ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <motion.span
                  initial={{ scale: 0, rotate: 0 }}
                  animate={{ scale: 1, rotate: 360 }}
                  className="text-highlight font-bold bg-secondary p-4 rounded-full"
                >
                  <Box size={50} />
                </motion.span>
                <motion.h2
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-xl font-medium text-highlight mb-2"
                >
                  Welcome to Chatterbox
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.65 }}
                  className="text-highlight max-w-md"
                >
                  Please log in with Google to start chatting and save your
                  conversation history.
                </motion.p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <motion.span
                  initial={{ scale: 0, rotate: 0 }}
                  animate={{ scale: 1, rotate: 360 }}
                  className="text-highlight font-bold bg-secondary p-4 rounded-full"
                >
                  <Box size={50} />
                </motion.span>
                <motion.h2
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-xl font-medium text-highlight mb-2"
                >
                  How can I help you today?
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.65 }}
                  className="text-highlight max-w-md"
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
              <div className="text-red-500 text-sm">Error: {apiError}</div>
            )}
            {isLoading && (
              <div className="flex items-start">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center mr-4 flex-shrink-0">
                  <span className="text-highlight font-bold text-sm">
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
                      className="h-2 w-2 bg-hightext-highlight rounded-full"
                    ></motion.div>
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </main>

        {/* Input area */}
        <footer className="p-4 bg-secondary">
          <div className="max-w-4xl pl-2 mx-auto">
            <ChatInput
              onSendMessage={handleSendMessage}
              disabled={isLoading || !session?.user}
            />
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-center text-highlight mt-2"
            >
              Chatterbox may display inaccurate info, including about people, so
              double-check its responses.
            </motion.div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
