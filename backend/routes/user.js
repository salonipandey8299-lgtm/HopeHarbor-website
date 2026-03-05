import express from "express";
import User from "../models/User.js";
import { auth, adminOnly } from "../middleware/auth.js";

const router = express.Router();


// ================= USER PROFILE =================
router.get("/profile", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(user);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});


// ================= ADMIN - GET ALL USERS =================
router.get("/admin", auth, adminOnly, async (req, res) => {
    try {
        const users = await User.find().select("-password");
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});


export default router;