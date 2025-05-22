import axios from "axios";
import { Request, Response, Router } from "express";

const router = Router();

const API_URL = process.env.API_URL;
const API_KEY = process.env.API_KEY;

router.post("/", async (req: Request, res: Response) => {
  try {
    const { message, chatHistory } = req.body;

    if (!message) {
      res.status(400).json({ error: "Message is required" });
      return;
    }
    const allMessages = [
      ...chatHistory,
      {
        role: "user",
        content: message,
      },
    ];

    const requestBody = {
      model: "gpt-4o-mini",
      messages: allMessages,
      temperature: 0.7,
      max_tokens: 1000,
    };

    if (!API_URL) {
      res.status(500).json({ error: "API_URL is not configured" });
      return;
    }

    const aiResponse = await axios.post(API_URL, requestBody, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
    });

    if (aiResponse.data.choices && aiResponse.data.choices.length > 0) {
      if (aiResponse.data.choices[0].message) {
        res.json({
          response: aiResponse.data.choices[0].message.content,
        });
        return;
      }
    }
    console.warn("Unexpected response from OpenAI API:", aiResponse.data);

    res.status(500).json({
      error: "Unexpected response format from AI service",
      response:
        "I encountered an issue processing your request. Please try again.",
    });
    return;
  } catch (error) {
    // First check if it's an Error object
    if (error instanceof Error) {
      console.error("Error in chat processing:", error.message);

      // For axios errors
      if (axios.isAxiosError(error)) {
        console.error("Axios error details:", error.response?.data);

        // OpenAI API error
        if (error.response?.status === 401) {
          res.status(500).json({ error: "API authentication failed" });
          return;
        } else if (error.response?.status === 429) {
          res
            .status(429)
            .json({ error: "Rate limit exceeded. Please try again later." });
          return;
        }
        res.status(500).json({
          error:
            (error.response?.data as any)?.error?.message ||
            "API service error",
        });
        return;
      }

      // Other errors
      res
        .status(500)
        .json({ error: "An error occurred while processing your request" });
      return;
    } else {
      // For non-Error thrown values
      console.error("Unexpected error type:", error);
      res.status(500).json({ error: "An unknown error occurred" });
      return;
    }
  }
});
export default router;
