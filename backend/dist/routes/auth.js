"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateSession = void 0;
const express_1 = __importDefault(require("express"));
const User_1 = __importDefault(require("../models/User"));
const passport_1 = __importDefault(require("passport"));
require("../config/passport");
const router = express_1.default.Router();
router.post("/login", async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User_1.default.findOne({ email });
        if (!user) {
            res.status(400).json({ message: "User not found" });
            return;
        }
        req.session.user = {
            _id: user._id.toString(),
            username: user.username,
            email: user.email,
        };
        res.status(200).json({
            message: "Login successful",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
            },
        });
    }
    catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});
router.get("/google", passport_1.default.authenticate("google", { scope: ["profile", "email"] }));
router.get("/google/callback", passport_1.default.authenticate("google", {
    session: false,
    failureRedirect: "/login",
}), (req, res) => {
    const user = req.user;
    req.session.user = {
        _id: user._id.toString(),
        username: user.username,
        email: user.email,
        googleId: user.googleId,
    };
    // Redirect without token since we're using sessions
    res.redirect(`${process.env.CLIENT_URL}/auth/callback`);
});
router.post("/logout", (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            console.error("Session destruction error:", error);
            res.status(500).json({ message: "Error logging out" });
        }
        else {
            res.clearCookie("connect.sid"); // Clear the session cookie
            res.status(200).json({ message: "Logged out successfully" });
        }
    });
});
// Session-based authentication middleware
const authenticateSession = (req, res, next) => {
    if (!req.session.user) {
        res.status(401).json({ message: "Authentication required" });
        return;
    }
    // Set user info for routes
    req.user = { id: req.session.user._id };
    next();
};
exports.authenticateSession = authenticateSession;
router.get("/profile", exports.authenticateSession, async (req, res) => {
    try {
        // Add null check for req.session.user to satisfy TypeScript
        if (!req.session.user) {
            res.status(401).json({ message: "Authentication required" });
            return;
        }
        const user = await User_1.default.findById(req.session.user._id);
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});
exports.default = router;
