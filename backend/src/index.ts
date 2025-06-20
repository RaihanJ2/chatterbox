import express from "express";
import session from "express-session";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db";
import MongoStore from "connect-mongo";
import passport from "./config/passport";
import authRoutes from "./routes/auth";
import chatRoutes from "./routes/chat";
import chatHistoryRoutes from "./routes/chatHistory";

declare module "express-session" {
  interface SessionData {
    user: {
      _id: string;
      username?: string;
      email?: string;
      googleId?: string;
    };
  }
}

dotenv.config();
const app = express();
connectDB();
app.use(express.json());

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use(
  session({
    secret: process.env.SESSION_SECRET as string,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI!,
      collectionName: "sessions",
      ttl: 24 * 60 * 60,
    }),
    cookie: {
      secure: true,
      httpOnly: true,
      sameSite: "none",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  })
);

// Initialize passport and sessions
app.use(passport.initialize());
app.use(passport.session()); // This was missing!

app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/chats", chatHistoryRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
