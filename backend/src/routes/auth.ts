import express, { Request, Response } from "express";
import User from "../models/User";
import jwt from "jsonwebtoken";
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

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET!, {
      expiresIn: "1h",
    });
    res.status(200).json({ token });
  } catch (error) {
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
    session: false,
    failureRedirect: "/login",
  }),
  (req: Request, res: Response) => {
    const user = req.user as any;

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET!, {
      expiresIn: "1h",
    });

    req.session.user = {
      _id: user._id.toString(),
      username: user.username,
      email: user.email,
      googleId: user.googleId,
    };

    res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
  }
);

router.post("/logout", (req: Request, res: Response): void => {
  req.session.destroy((error) => {
    if (error) {
      console.error("Session destruction error:", error);
      res.status(500).json({ message: "Error logging out" });
    } else {
      res.status(200).json({ message: "Logged out successfully" });
    }
  });
});

export const authenticateToken = (
  req: Request & { user?: any },
  res: Response,
  next: Function
): void => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ message: "Access denied" });
    return;
  }

  jwt.verify(token, process.env.JWT_SECRET!, (error, decoded) => {
    if (error) {
      res.status(403).json({ message: "Invalid token" });
      return;
    }
    req.user = decoded;
    next();
  });
};

router.get(
  "/profile",
  authenticateToken,
  async (req: Request & { user?: any }, res: Response) => {
    try {
      const user = await User.findById(req.user.id);

      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

export default router;
