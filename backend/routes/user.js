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

    res.json({
      message: "Profile fetched successfully",
      user,
    });
  } catch (err) {
    console.error("PROFILE ERROR:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ================= ADMIN - GET ALL USERS =================
router.get("/admin", auth, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select("-password");

    res.json({
      message: "All users fetched successfully",
      users,
    });
  } catch (err) {
    console.error("ADMIN GET USERS ERROR:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;