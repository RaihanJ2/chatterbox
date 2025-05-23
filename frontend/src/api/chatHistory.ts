import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Configure axios to include auth token
axios.defaults.withCredentials = true;

axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export interface ChatSummary {
  _id: string;
  title: string;
  updatedAt: string;
  messageCount: number;
  lastMessage: string;
}

export interface ChatHistory {
  _id: string;
  title: string;
  messages: Array<{
    role: "user" | "assistant";
    content: string;
    timestamp: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

// Get all chat summaries for the user
export const getChatHistory = async (): Promise<ChatSummary[]> => {
  try {
    const response = await axios.get(`${API_URL}/api/chats`);
    return response.data;
  } catch (error) {
    console.error("Error fetching chat history:", error);
    throw error;
  }
};

// Get specific chat with all messages
export const getChatById = async (chatId: string): Promise<ChatHistory> => {
  try {
    const response = await axios.get(`${API_URL}/api/chats/${chatId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching chat:", error);
    throw error;
  }
};

// Create new chat
export const createNewChat = async (title?: string): Promise<ChatHistory> => {
  try {
    const response = await axios.post(`${API_URL}/api/chats`, { title });
    return response.data;
  } catch (error) {
    console.error("Error creating chat:", error);
    throw error;
  }
};

// Update chat title
export const updateChatTitle = async (
  chatId: string,
  title: string
): Promise<void> => {
  try {
    await axios.patch(`${API_URL}/api/chats/${chatId}/title`, { title });
  } catch (error) {
    console.error("Error updating chat title:", error);
    throw error;
  }
};

// Delete chat
export const deleteChat = async (chatId: string): Promise<void> => {
  try {
    await axios.delete(`${API_URL}/api/chats/${chatId}`);
  } catch (error) {
    console.error("Error deleting chat:", error);
    throw error;
  }
};

// Updated sendMessageToAPI to include chatId and use proper authentication
export async function sendMessageToAPI(
  message: string,
  chatId?: string
): Promise<{ response: string; chatId: string; title: string }> {
  try {
    const token = localStorage.getItem("authToken");

    if (!token) {
      throw new Error("Authentication required. Please log in.");
    }

    const res = await fetch(`${API_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      body: JSON.stringify({
        message,
        chatId,
      }),
    });

    if (!res.ok) {
      const errorData = await res.text();
      console.error("API error:", errorData);

      if (res.status === 401) {
        throw new Error(
          "Authentication failed. Please check if you're logged in."
        );
      } else if (res.status === 403) {
        throw new Error(
          "Authorization failed. You don't have permission to access this resource."
        );
      } else if (res.status === 429) {
        throw new Error("Rate limit exceeded. Please try again later.");
      } else {
        throw new Error(`API error: ${res.status}`);
      }
    }

    const data = await res.json();
    return {
      response: data.response,
      chatId: data.chatId,
      title: data.title,
    };
  } catch (error) {
    console.error("Error calling API:", error);
    throw error;
  }
}
