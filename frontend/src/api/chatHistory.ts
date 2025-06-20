import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

axios.defaults.withCredentials = true;

export interface ChatSummary {
  _id: string;
  title: string;
  updatedAt: string;
  messageCount: number;
  lastMessage: string | null;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface Chat {
  _id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: string;
  createdAt: string;
}

export interface SendMessageResponse {
  response: string;
  chatId: string;
  title: string;
}

export const sendMessageToAPI = async (
  message: string,
  chatId?: string
): Promise<SendMessageResponse> => {
  try {
    const response = await axios.post(`${API_URL}/api/chat`, {
      message,
      chatId,
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // Handle specific HTTP errors
      if (error.response?.status === 401) {
        throw new Error("Authentication required. Please log in again.");
      } else if (error.response?.status === 429) {
        throw new Error("Rate limit exceeded. Please try again later.");
      } else if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
    }
    throw new Error("Failed to send message. Please try again.");
  }
};

export const getChatHistory = async (): Promise<ChatSummary[]> => {
  try {
    const response = await axios.get(`${API_URL}/api/chats`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      throw new Error("Authentication required. Please log in again.");
    }
    throw new Error("Failed to fetch chat history");
  }
};

export const getChatById = async (chatId: string): Promise<Chat> => {
  try {
    const response = await axios.get(`${API_URL}/api/chats/${chatId}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        throw new Error("Authentication required. Please log in again.");
      } else if (error.response?.status === 404) {
        throw new Error("Chat not found");
      }
    }
    throw new Error("Failed to fetch chat");
  }
};

export const updateChatTitle = async (
  chatId: string,
  title: string
): Promise<void> => {
  try {
    await axios.patch(`${API_URL}/api/chats/${chatId}/title`, { title });
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      throw new Error("Authentication required. Please log in again.");
    }
    throw new Error("Failed to update chat title");
  }
};

export const deleteChat = async (chatId: string): Promise<void> => {
  try {
    await axios.delete(`${API_URL}/api/chats/${chatId}`);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      throw new Error("Authentication required. Please log in again.");
    }
    throw new Error("Failed to delete chat");
  }
};

export const createNewChat = async (title?: string): Promise<Chat> => {
  try {
    const response = await axios.post(`${API_URL}/api/chats`, { title });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      throw new Error("Authentication required. Please log in again.");
    }
    throw new Error("Failed to create new chat");
  }
};
