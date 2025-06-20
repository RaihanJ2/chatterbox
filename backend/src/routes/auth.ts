import express, { Request, Response } from "express";
import User, { UserType } from "../models/User";
import passport from "passport";
import "../config/passport";

const router = express.Router();

router.post("/login", async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      res.status(400).json({ message: "User not found" });
      return;
    }

    req.session.user = {
      _id: user._id.toString(),
      username: user.username,
      email: user.email,
    };

    // Save session explicitly
    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        res.status(500).json({ message: "Session error" });
        return;
      }

      res.status(200).json({
        message: "Login successful",
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
        },
      });
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
  }),
  (req: Request, res: Response) => {
    const user = req.user as UserType;

    req.session.user = {
      _id: user._id.toString(),
      username: user.username,
      email: user.email,
      googleId: user.googleId,
    };

    // Save session before redirecting
    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        res.redirect(`${process.env.CLIENT_URL}/login?error=session`);
        return;
      }
      res.redirect(`${process.env.CLIENT_URL}/auth/callback`);
    });
  }
);

router.post("/logout", (req: Request, res: Response): void => {
  req.session.destroy((error) => {
    if (error) {
      console.error("Session destruction error:", error);
      res.status(500).json({ message: "Error logging out" });
    } else {
      // Clear all possible session cookie names
      res.clearCookie("connect.sid");
      res.clearCookie("connect.sid", { path: "/" });
      res.clearCookie("connect.sid", {
        path: "/",
        domain:
          process.env.NODE_ENV === "production" ? ".onrender.com" : undefined,
      });
      res.status(200).json({ message: "Logged out successfully" });
    }
  });
});

export const authenticateSession = (
  req: Request & { user?: any },
  res: Response,
  next: Function
): void => {
  console.log("Session check:", {
    sessionID: req.sessionID,
    hasSession: !!req.session,
    hasUser: !!req.session?.user,
    user: req.session?.user,
  });

  if (!req.session.user) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  req.user = { id: req.session.user._id };
  next();
};

router.get(
  "/profile",
  authenticateSession,
  async (req: Request & { user?: any }, res: Response) => {
    try {
      if (!req.session.user) {
        res.status(401).json({ message: "Authentication required" });
        return;
      }

      const user = await User.findById(req.session.user._id);

      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      // Return user data in the format expected by frontend
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        googleId: user.googleId,
      });
    } catch (error) {
      console.error("Profile fetch error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Add a session check route for debugging
router.get("/session", (req: Request, res: Response) => {
  res.json({
    sessionID: req.sessionID,
    hasSession: !!req.session,
    hasUser: !!req.session?.user,
    user: req.session?.user || null,
  });
});

export default router;
