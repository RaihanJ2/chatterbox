const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

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

// Helper function to make authenticated requests
const makeAuthenticatedRequest = async (
  url: string,
  options: RequestInit = {}
) => {
  const response = await fetch(url, {
    ...options,
    credentials: "include", // Use cookies instead of Bearer tokens
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error: ${response.status} - ${errorText}`);
  }

  return response;
};

// Get all chat summaries for the user
export const getChatHistory = async (): Promise<ChatSummary[]> => {
  try {
    const response = await makeAuthenticatedRequest(`${API_URL}/api/chats`);
    return response.json();
  } catch (error) {
    console.error("Error fetching chat history:", error);
    throw error;
  }
};

// Get specific chat with all messages
export const getChatById = async (chatId: string): Promise<ChatHistory> => {
  try {
    const response = await makeAuthenticatedRequest(
      `${API_URL}/api/chats/${chatId}`
    );
    return response.json();
  } catch (error) {
    console.error("Error fetching chat:", error);
    throw error;
  }
};

// Create new chat
export const createNewChat = async (title?: string): Promise<ChatHistory> => {
  try {
    const response = await makeAuthenticatedRequest(`${API_URL}/api/chats`, {
      method: "POST",
      body: JSON.stringify({ title }),
    });
    return response.json();
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
    await makeAuthenticatedRequest(`${API_URL}/api/chats/${chatId}/title`, {
      method: "PATCH",
      body: JSON.stringify({ title }),
    });
  } catch (error) {
    console.error("Error updating chat title:", error);
    throw error;
  }
};

// Delete chat
export const deleteChat = async (chatId: string): Promise<void> => {
  try {
    await makeAuthenticatedRequest(`${API_URL}/api/chats/${chatId}`, {
      method: "DELETE",
    });
  } catch (error) {
    console.error("Error deleting chat:", error);
    throw error;
  }
};

// Send message to API
export async function sendMessageToAPI(
  message: string,
  chatId?: string
): Promise<{ response: string; chatId: string; title: string }> {
  try {
    const response = await makeAuthenticatedRequest(`${API_URL}/api/chat`, {
      method: "POST",
      body: JSON.stringify({
        message,
        chatId,
      }),
    });

    const data = await response.json();
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
