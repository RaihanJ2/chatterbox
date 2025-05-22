export async function sendMessageToAPI(
  message: string,
  chatHistory: { role: string; content: string }[] = []
): Promise<string> {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  try {
    const res = await fetch(`${API_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        message,
        chatHistory,
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
    return data.res;
  } catch (error) {
    console.error("Error calling API:", error);
    throw error;
  }
}
