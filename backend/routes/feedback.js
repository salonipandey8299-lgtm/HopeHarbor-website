import express from "express";
import Feedback from "../models/Feedback.js";

const router = express.Router();

// POST feedback
router.post("/", async (req, res) => {
    try {
        const { message, name } = req.body;
        if (!message) return res.status(400).json({ message: "Feedback is required" });

        const newFeedback = new Feedback({ message, name: name || "Anonymous" });
        await newFeedback.save();

        res.json({ message: "Feedback submitted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// GET all feedback
router.get("/", async (req, res) => {
    try {
        const feedbacks = await Feedback.find().sort({ createdAt: -1 });
        res.json(feedbacks);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

export default router;